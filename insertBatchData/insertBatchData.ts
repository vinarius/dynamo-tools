console.log('Insert batch data initiated...');

import { DynamoDB } from 'aws-sdk';
import { BatchWriteItemInput } from 'aws-sdk/clients/dynamodb';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const unsetEnvVars: string[] = [];
if (process.env['AWS_PROFILE'] === undefined) unsetEnvVars.push('AWS_PROFILE');
if (process.env['SOURCE_ENV'] === undefined) unsetEnvVars.push('SOURCE_ENV');
if (process.env['DESTINATION_TABLE_NAME'] === undefined) unsetEnvVars.push('DESTINATION_TABLE_NAME');
if (process.env['DESTINATION_REGION'] === undefined) unsetEnvVars.push('DESTINATION_REGION');
if (process.env['PROJECT'] === undefined) unsetEnvVars.push('PROJECT');

if (unsetEnvVars.length > 0) {
  console.error(`Please set the following environment variables and run the script again:\n${unsetEnvVars.join(' ')}`);
  process.exit(1);
}

const region: string = process.env['DESTINATION_REGION'];
const dynamoDb = new DynamoDB({
  region
});
const dynamoTableName: string = process.env['DESTINATION_TABLE_NAME'];

(async function () {
  try {
    const sourceEnv = process.env.SOURCE_ENV;
    const project = process.env.PROJECT;
    const batchWrites = [];
    const dataDirectoryPath: string = resolve(__dirname, '..', 'scanTableToJson', 'backups', project, sourceEnv);
    const files: string[] = readdirSync(dataDirectoryPath);

    files.forEach(file => {
      const filePath = resolve(dataDirectoryPath, file);
      const tableData: any = readFileSync(filePath, { encoding: 'utf-8' });
      const params: BatchWriteItemInput = {
        RequestItems: JSON.parse(tableData)
      };

      batchWrites.push(dynamoDb.batchWriteItem(params).promise());
    });

    await Promise.all(batchWrites);

    console.log(`Data write to ${dynamoTableName} successful.`);
  } catch (error) {
    throw new Error(error);
  }
})();