// CONSTANT
const HOST = '127.0.0.1';
const PORT = 8080;

// Camunda base URL
const CAMUNDA_URL = `http://${HOST}:${PORT}/engine-rest`;

// URLs
const GET_PROCESS_INSTANCE_URL = `${CAMUNDA_URL}/history/process-instance`;
const DELETE_PROCESS_INSTANCE_URL = `${CAMUNDA_URL}/process-instance/`;

// include conditions
const INCLUDED_CONDITION = {
    unfinished: true,
    processDefinitionId: 'riskTreatmentReview:2:ba43cfae-37f7-11ee-a921-0242ac130003'
};

// exclude conditions
const EXCLUDED_CONDITION = {};
