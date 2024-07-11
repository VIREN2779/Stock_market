// const puppeteer = require('puppeteer');
// const fs = require('fs');
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// (async () => {
//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();
//     await page.goto('https://dhan.co/all-stocks-list/', { waitUntil: 'networkidle2', timeout: 0 });

//     const tabs = [
//         'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
//         'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Other'
//     ];

//     let allData = [];

//     for (const tab of tabs) {
//         await page.click(`label[for="${tab}"]`);
//         await page.waitForSelector('#sec_table > tr', { timeout: 5000 });

//         const data = await page.evaluate(() => {
//             const rows = document.querySelectorAll('#sec_table > tr');
//             let result = [];
//             rows.forEach(row => {
//                 const companyNameElement = row.querySelector('td:nth-child(1) > a > p');
//                 const LTPElement = row.querySelector('td:nth-child(2)');
//                 const weekHighElement = row.querySelector('td:nth-child(6)');
//                 const weekLowElement = row.querySelector('td:nth-child(7)');

//                 if (companyNameElement && LTPElement && weekHighElement && weekLowElement) {
//                     const companyName = companyNameElement.innerText.trim();
//                     const LTP = LTPElement.innerText.trim();
//                     const weekHigh = weekHighElement.innerText.trim();
//                     const weekLow = weekLowElement.innerText.trim();

//                     result.push({
//                         companyName,
//                         LTP,
//                         weekHigh,
//                         weekLow
//                     });
//                 }
//             });
//             return result;
//         });

//         allData = allData.concat(data);
//     }

//     // Define the CSV writer
//     const csvWriter = createCsvWriter({
//         path: 'all_stocks_list.csv',
//         header: [
//             { id: 'companyName', title: 'Company Name' },
//             { id: 'LTP', title: 'LTP(Last Traded Price)' },
//             { id: 'weekHigh', title: '52 Week High' },
//             { id: 'weekLow', title: '52 Week Low' },
//         ]
//     });

//     // Write data to CSV file
//     await csvWriter.writeRecords(allData);
//     console.log('Data written to CSV file successfully.');

//     await browser.close();
// })();

// -------------------------------------------------------------------------------------------------

const puppeteer = require('puppeteer');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://dhan.co/all-stocks-list/', { waitUntil: 'load', timeout: 0 });

    const tabs = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Other'
    ];

    let allData = [];

    for (const tab of tabs) {
        await page.click(`label[for="${tab}"]`);
        await page.waitForSelector('#sec_table > tr', { timeout: 5000 });

        let hasNextPage = true;
        while (hasNextPage) {
            const data = await page.evaluate(() => {
                const rows = document.querySelectorAll('#sec_table > tr');
                let result = [];
                rows.forEach(row => {
                    const companyNameElement = row.querySelector('td:nth-child(1) > a > p');
                    const LTPElement = row.querySelector('td:nth-child(2)');
                    const weekHighElement = row.querySelector('td:nth-child(6)');
                    const weekLowElement = row.querySelector('td:nth-child(7)');

                    if (companyNameElement && LTPElement && weekHighElement && weekLowElement) {
                        const companyName = companyNameElement.innerText.trim();
                        const LTP = parseFloat(LTPElement.innerText.trim().replace(/,/g, ''));
                        const weekHigh = weekHighElement.innerText.trim();
                        const weekLow = weekLowElement.innerText.trim();

                        result.push({
                            companyName,
                            LTP,
                            weekHigh,
                            weekLow
                        });
                    }
                });
                return result;
            });

            allData = allData.concat(data);

            // Check if there is a next page
            hasNextPage = await page.evaluate(() => {
                const nextPageButton = document.querySelector('.next'); // Adjust selector as per your website's pagination
                if (nextPageButton) {
                    nextPageButton.click();
                    return true;
                }
                return false;
            });

            if (hasNextPage) {
                await page.waitForSelector('#sec_table > tr', { timeout: 5000 });
            }
        }
    }

    // Define the CSV writer with an additional blank column header
    const csvWriter = createCsvWriter({
        path: 'all-stocks-list.csv',
        header: [
            { id: 'companyName', title: 'Company Name' },
            { id: 'blankColumn', title: '' }, // Blank column header for spacing
            { id: 'LTP', title: 'LTP (Last Traded Price)' },
            { id: 'weekHigh', title: '52 Week High' },
            { id: 'weekLow', title: '52 Week Low' },
        ]
    });

    // Write data to CSV file
    await csvWriter.writeRecords(allData);
    console.log('Data written to CSV file successfully.');

    // Generate PDF file with tabular format
    const pdfDoc = await PDFDocument.create();
    const pdfTablePage = pdfDoc.addPage();
    const { width, height } = pdfTablePage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const tableTopY = height - 50;
    const tableMargin = 30;
    const columnWidth = (width - 2 * tableMargin) / 5; // Adjust for 5 columns now

    // Define colors for header and even rows
    const headerColor = rgb(0, 0, 1); // Blue color in range 0-1
    const evenRowColor = rgb(0, 0.5, 0); // Dark green color in range 0-1

    // Draw headers with right alignment
    pdfTablePage.drawText('Company Name', {
        x: tableMargin,
        y: tableTopY,
        size: fontSize,
        font: font,
        color: headerColor, // Set header text color
    });

    pdfTablePage.drawText('LTP', {
        x: tableMargin + 2 * columnWidth,
        y: tableTopY,
        size: fontSize,
        font: font,
        color: headerColor, // Set header text color
    });

    pdfTablePage.drawText('52WH', {
        x: tableMargin + 3 * columnWidth,
        y: tableTopY,
        size: fontSize,
        font: font,
        color: headerColor, // Set header text color
    });

    pdfTablePage.drawText('52WL', {
        x: tableMargin + 4 * columnWidth,
        y: tableTopY,
        size: fontSize,
        font: font,
        color: headerColor, // Set header text color
    });

    // Draw table rows
    let currentY = tableTopY - 20;
    allData.forEach((record, index) => {
        const rowColor = index % 2 === 0 ? evenRowColor : rgb(0, 0, 0); // Alternate row color logic

        // Draw Company Name (left aligned)
        pdfTablePage.drawText(record.companyName, {
            x: tableMargin,
            y: currentY - index * 20,
            size: fontSize,
            font: font,
            color: rowColor, // Set row text color
        });

        // Draw blank column
        pdfTablePage.drawText('', {
            x: tableMargin + columnWidth,
            y: currentY - index * 20,
            size: fontSize,
            font: font,
            color: rowColor, // Set row text color
        });

        // Draw LTP (right aligned)
        pdfTablePage.drawText(record.LTP.toString(), {
            x: tableMargin + 2 * columnWidth + (columnWidth - font.widthOfTextAtSize(record.LTP.toString(), fontSize)),
            y: currentY - index * 20,
            size: fontSize,
            font: font,
            color: rowColor, // Set row text color
        });

        // Draw 52 Week High (right aligned)
        pdfTablePage.drawText(record.weekHigh, {
            x: tableMargin + 3 * columnWidth + (columnWidth - font.widthOfTextAtSize(record.weekHigh, fontSize)),
            y: currentY - index * 20,
            size: fontSize,
            font: font,
            color: rowColor, // Set row text color
        });

        // Draw 52 Week Low (right aligned)
        pdfTablePage.drawText(record.weekLow, {
            x: tableMargin + 4 * columnWidth + (columnWidth - font.widthOfTextAtSize(record.weekLow, fontSize)),
            y: currentY - index * 20,
            size: fontSize,
            font: font,
            color: rowColor, // Set row text color
        });
    });

    // Save PDF file
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('all-stocks-list.pdf', pdfBytes);
    console.log('Data written to PDF file successfully.');

    await browser.close();
})();
