const puppeteer = require('puppeteer');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://dhan.co/all-stocks-list/', { waitUntil: 'networkidle2', timeout: 0 });

    const tabs = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Other'
    ];

    let allData = [];

    for (const tab of tabs) {
        await page.click(`label[for="${tab}"]`);
        await page.waitForSelector('#sec_table > tr', { timeout: 5000 });
        
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
                    const LTP = LTPElement.innerText.trim();
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
    }

    // Define the CSV writer
    const csvWriter = createCsvWriter({
        path: 'all_stocks_list.csv',
        header: [
            { id: 'companyName', title: 'Company Name' },
            { id: 'LTP', title: 'LTP(Last Traded Price)' },
            { id: 'weekHigh', title: '52 Week High' },
            { id: 'weekLow', title: '52 Week Low' },
        ]
    });

    // Write data to CSV file
    await csvWriter.writeRecords(allData);
    console.log('Data written to CSV file successfully.');

    await browser.close();
})();