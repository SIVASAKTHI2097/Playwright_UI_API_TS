import fs from 'fs';
import path from 'path';
/**
 * This file contains utility functions to assist with UI-related tasks in Dynamics 365.
 * Examples include generating dynamic names, phone numbers, and addresses.
 */
export class Helpers {
    constructor() {}

    /**
     * Appends current time (HHmmss) to a given base name.
     * Example: siva -> siva141105
     * @param base The base string to which the time will be appended
     * @returns The base string appended with the current time
     */
    async withCurrentTime(base: string): Promise<string> {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${base}${hh}${mm}${ss}`;
    }

    /** Appends current date (ddMMyyyy) to a given base name.
     * Example: report -> report25062024
     * @param base The base string to which the date will be appended
     * @returns The base string appended with the current date
     */
    async withCurrentDate(base: string): Promise<string> {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-based
        const yyyy = now.getFullYear();
        return `${base}${dd}${mm}${yyyy}`;
    }

    /** Appends current time with milliseconds (HHmmssSSS) to a given base name.
     * Example: siva -> siva141105123
     * @param base The base string to which the timestamp will be appended
     * @returns The base string appended with the current time including milliseconds
     */
    async withCurrentTimeWithMillis(base: string): Promise<string> {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${base}${hh}${mm}${ss}${ms}`;
    }

    /**
     * Generates phone number based on country code rules.
     * @param country The country for which to generate the phone number
     * @returns A phone number string
     */
    async generatePhoneNumber(country: string): Promise<string> {
        const rules: Record<string, { code: string; length: number }> = {
            india: { code: '+91', length: 10 },
            usa: { code: '+1', length: 10 },
            uk: { code: '+44', length: 10 },
            singapore: { code: '+65', length: 8 },
            hongkong: { code: '+852', length: 8 },
            australia: { code: '+61', length: 9 },
        };

        const rule = rules[country.toLowerCase()];
        if (!rule) throw new Error(`Phone rule not defined for country: ${country}`);

        const number = Array.from({ length: rule.length }, () => Math.floor(Math.random() * 10)).join('');

        return `${rule.code}${number}`;
    }

    /**
     * Generates a realistic address based on country/city.
     * @param country The country for which to generate the address
     * @returns A randomly selected address string
     */
    async generateAddress(country: string): Promise<string> {
        const addressBook: Record<string, string[]> = {
            hongkong: ['12 Nathan Road, Tsim Sha Tsui, Kowloon, Hong Kong', '88 Queensway, Admiralty, Hong Kong', '25 Des Voeux Road Central, Central, Hong Kong'],
            india: ['45 MG Road, Bengaluru, Karnataka, India', '21 Anna Salai, Chennai, Tamil Nadu, India', '10 Connaught Place, New Delhi, India'],
            usa: ['350 5th Ave, New York, NY 10118, USA', '1 Infinite Loop, Cupertino, CA 95014, USA'],
            uk: ['221B Baker Street, London, UK', '10 Downing Street, London, UK'],
        };

        const addresses = addressBook[country.toLowerCase()];
        if (!addresses) throw new Error(`No address data for: ${country}`);

        return addresses[Math.floor(Math.random() * addresses.length)];
    }

    /** Generates a random number string of specified length
     * @param length The length of the random number string
     * @returns A string representing the random number
     */
    async generateRandomNumber(length: number = 1): Promise<string> {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }

        return result;
    }

    /** Generates a random string with a numeric suffix
     * @param prefix The prefix string
     * @param length The length of the numeric suffix
     * @returns The combined string with prefix and random numeric suffix
     */
    async generateRandomStringWithNumber(prefix: string, length: number): Promise<string> {
        const randomPart = await this.generateRandomNumber(length);
        return `${prefix}${randomPart}`;
    }

    /**
     * This method is to copy the excel files into the shared file path
     * @param sourceFilePath pass the source file path ex: const localExcelPath = path.resolve('./test-data/ui-data/PO -201- DSVNJ.xlsx');
     * @param sharedFolderPath pass the destination folder ex: const sharedPath = String.raw`\\UKCLAP-LOB-INT\Integrations\UPGRADE\PurchaseOrders\201`;
     * @returns
     */
    async copyFileToSharedPath(sourceFilePath: string, sharedFolderPath: string): Promise<string> {
        try {
            if (!fs.existsSync(sourceFilePath)) {
                throw new Error(`Source file not found: ${sourceFilePath}`);
            }

            if (!fs.existsSync(sharedFolderPath)) {
                console.log('Resolved shared path:', sharedFolderPath);
                throw new Error(`Shared path not accessible: ${sharedFolderPath}`);
            }

            const fileName = path.basename(sourceFilePath);
            const destinationPath = path.join(sharedFolderPath, fileName);

            fs.copyFileSync(sourceFilePath, destinationPath);

            console.log(`File copied successfully to: ${destinationPath}`);

            return destinationPath;
        } catch (error) {
            console.error('Error copying file to shared path:', error);
            throw error;
        }
    }

    /**
     * Extracts a substring from the given value based on the specified start and end indices.
     * @param value The string value from which to extract the substring
     * @param startIndex The starting index for extraction (default is 0)
     * @param endIndex The ending index for extraction (default is 3)
     * @returns
     */
    async getExtractedValueFromString(value: string, startIndex: number = 0, endIndex: number = 3): Promise<string> {
        return value.substring(startIndex, endIndex);
    }
}
