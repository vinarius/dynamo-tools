'use strict';

import { DynamoDB } from 'aws-sdk';
import { BatchWriteItemInput } from 'aws-sdk/clients/dynamodb';
import { readFileSync, readdirSync } from 'fs';

if(!process.env['TABLE_NAME']) {
  console.error('Environemnt variable "TABLE_NAME" is not set. Please set this and run the script again.');
  process.exit(1);
}

if(!process.env['REGION']) {
  console.error('Environemnt variable "REGION" is not set. Please set this and run the script again.');
  process.exit(1);
}

const region: string = process.env['REGION'] ?? '';
const dynamoDb = new DynamoDB({
  region
});
const dynamoTableName: string = process.env['TABLE_NAME'] ?? '';


(async function(){
  try {
      const batchWrites = [];
      const directory: string = 'admin-data';
      const files: string[] = readdirSync(`../scanTableToJson/${directory}`);

      files.forEach(file => {
        const tableData: any = readFileSync(`../scanTableToJson/${directory}/${file}`, {encoding: 'utf-8'});
        const params: BatchWriteItemInput = {
          RequestItems: JSON.parse(tableData)
        };

        batchWrites.push(dynamoDb.batchWriteItem(params).promise());
      });

      await Promise.all(batchWrites);
      
      console.log(`Data write to ${dynamoTableName} successful.`);
  } catch (error) {
    console.error('error conjuring magic:', error);
    throw new Error(error);
  }
})();