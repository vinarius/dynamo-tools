'use strict';

// Import env variables
import { config } from 'dotenv';
config();

import { DynamoDB } from 'aws-sdk';
import { BatchWriteItemInput, WriteRequest, DocumentClient, BatchWriteItemOutput } from 'aws-sdk/clients/dynamodb';
import * as csv from 'csvtojson';
import { readFileSync, readdirSync } from 'fs';

if(!process.env['TABLE_NAME']) {
  console.error('Environemnt variable "TABLE_NAME" is not set. Please set this and run the script again.');
  process.exit(1);
}

if(!process.env['REGION']) {
  console.error('Environemnt variable "REGION" is not set. Please set this and run the script again.');
  process.exit(1);
}

interface ParsedData {
  [key: string]: string
}

const region: string = process.env['REGION'] ?? '';
const dynamoDb = new DynamoDB({
  region
});
const dynamoTableName: string = process.env['TABLE_NAME'] ?? '';


  // async function prepareDataAndExecuteBatchWrites (dataSet: any, tableName: string, needsDocumentParsing: boolean): Promise<BatchWriteItemOutput[]> {
  //   const batches: WriteRequest[][] = [];
  //   let dynamoDbWriteBatch: WriteRequest[] = [];
  //   const cache: string[] = [];

  //   let modifiedDataSet: any[] = JSON.parse(JSON.stringify(dataSet));

  //   if (needsDocumentParsing) {
  //     modifiedDataSet = dataSet.map(dataElement => {
  //       const modifiedData: ParsedData = {};

  //       /*
  //         Example data:
  //         Before
  //         {
  //           'phoneNumber (S)': '+18339722268',
  //           'country (S)': 'Afghanistan',
  //           'countryCode (N)': '93',
  //           'languageCode (S)': 'en-US',
  //           'sor (S)': 'US'
  //         }
        
  //       */

  //       for (const prop in dataElement) {
  //         const value: string = dataElement[prop];
  //         const props: string[] = prop.split(' ');
  //         const propName: string = props[0];
  //         modifiedData[propName] = value;
  //       }


  //       /*
  //         Example data:
  //         After
  //         {
  //           'phoneNumber': '+18339722268',
  //           'country': 'Afghanistan',
  //           'countryCode': '93',
  //           'languageCode': 'en-US',
  //           'sor': 'US'
  //         }
        
  //       */

  //       return modifiedData;
  //     });
  //   }

  //   modifiedDataSet.forEach((element: ParsedData) => {
  //     const newItemConstructor: any = {};
  //     for (const prop in element) {
  //       const value: any = element[prop];

  //       // If prop is countryCode convert to type number, else leave as string.
  //       switch(prop) {
  //         case 'countryCode':
  //           newItemConstructor[prop] = parseInt(value);
  //           break;
  //         default:
  //           newItemConstructor[prop] = value;
  //           break;
  //       }
  //     }

  //     // use array as a temporary cache to remove duplicates based on the primary key
  //     const primaryKey: string = `${newItemConstructor['phoneNumber']}-${newItemConstructor['country']}`;
  //     if(!cache.includes(primaryKey)) {
  //       const PutRequest: WriteRequest = {
  //         PutRequest: {
  //           Item: newItemConstructor
  //         }
  //       };
  //       dynamoDbWriteBatch.push(PutRequest);
  //       cache.push(primaryKey);
  //     }

  //     // DynamoDB batch writes only accept up to 25 write requests at a time.
  //     // Therefore, I divided the data into batches and made however many calls necessary with 25 data write requests per batch.
  //     if (dynamoDbWriteBatch.length === 25) {
  //       batches.push(dynamoDbWriteBatch);
  //       dynamoDbWriteBatch = [];
  //     }
  //   });

  //   Collect remaining write requests if remainder did not equal 25.
  //   if (dynamoDbWriteBatch.length > 0) {
  //     batches.push(dynamoDbWriteBatch);
  //   }

  //   const batchWriteParamsArr: Promise<BatchWriteItemOutput>[] = [];
  //   batches.forEach((batch: WriteRequest[]) => {
  //     const batchWriteParams: BatchWriteItemInput = {
  //       RequestItems: dataSet // json goes here
  //     };
  //     batchWriteParams['RequestItems'][tableName] = batch;
  //     batchWriteParamsArr.push(dynamoDb.batchWriteItem(batchWriteParams).promise());
  //   });

  //   return Promise.all(batchWriteParamsArr);
  // }


(async function(){
  try {
      // const languageData: any = await csv().fromFile('./table-data.csv');
      // await prepareDataAndExecuteBatchWrites(tableData, dynamoTableName, false);

      const batchWrites = [];
      const files: string[] = readdirSync('./scanTableToJson/data-output');

      files.forEach(file => {
        const tableData: any = readFileSync(`./scanTableToJson/data-output/${file}`, {encoding: 'utf-8'});
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