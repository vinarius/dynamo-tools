SOURCE_REGION=us-east-1 \
SOURCE_PROFILE=hhaexchange-qa-token \
SOURCE_ENV=qa \
SOURCE_TABLE_NAME=hhaex-qa-admin-table \
DESTINATION_REGION=us-east-1 \
DESTINATION_PROFILE=hhaexchange-dev-token \
DESTINATION_ENV=dev \
DESTINATION_TABLE_NAME=hhaex-dev-admin-table \
sh scanTableToJson/scanTableToJson.sh ${SOURCE_PROFILE} ${SOURCE_ENV} ${SOURCE_TABLE_NAME} ${DESTINATION_TABLE_NAME} ${SOURCE_REGION} \
sh insert-batch-data/insert.sh ${DESTINATION_PROFILE} ${DESTINATION_TABLE_NAME} ${DESTINATION_REGION}