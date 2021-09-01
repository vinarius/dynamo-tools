PROJECT="debtmerica"
SOURCE_ENV="dev"
SOURCE_REGION="us-west-2"
SOURCE_PROFILE="debtmerica-dev-token"
SOURCE_TABLE_NAME="debtmerica-admin-app-dev-admin-table"
DESTINATION_REGION="us-west-2"
DESTINATION_PROFILE="debtmerica-prod-token"
DESTINATION_TABLE_NAME="debtmerica-admin-app-prod-admin-table"

sh scanTableToJson/scanTableToJson.sh ${SOURCE_PROFILE} ${SOURCE_TABLE_NAME} ${DESTINATION_TABLE_NAME} ${SOURCE_REGION} ${PROJECT} ${SOURCE_ENV}
sh insertBatchData/insertBatchData.sh ${DESTINATION_PROFILE} ${SOURCE_ENV} ${DESTINATION_TABLE_NAME} ${DESTINATION_REGION} ${PROJECT}
