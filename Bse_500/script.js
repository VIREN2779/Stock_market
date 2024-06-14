const puppeteer = require('puppeteer');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://dhan.co/indices/bse-500-companies/', { waitUntil: 'load', timeout: 0 });

    const data = await page.evaluate(() => {
        const rows = document.querySelectorAll('#comp_tble > tr');
        let result = [];
        rows.forEach(row => {
            const companyNameElement = row.querySelector('td:nth-child(1) > a');
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

    // Define the CSV writer
    const csvWriter = createCsvWriter({
        path: 'Bse_500_companies.csv',
        header: [
            { id: 'companyName', title: 'Company Name' },
            { id: 'LTP', title: 'LTP(Last Traded Price)' },
            { id: 'weekHigh', title: '52 Week High' },
            { id: 'weekLow', title: '52 Week Low' },
        ]
    });

    // Write data to CSV file
    await csvWriter.writeRecords(data);
    console.log('Data written to CSV file successfully.');

    await browser.close();
})();
