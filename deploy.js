#!/usr/bin/env node
const argv = require('yargs')
    .boolean('l')
    .alias('l', 'live')
    .describe('l', 'Run this command on the live servers')
    .alias('b', 'build')
    .describe('b', 'Pass a custom build number to deploy')
    .help('h')
    .alias('h', 'help')
    .argv;
const prompt = require('prompt');
const AWS = require('aws-sdk');

let customBuildNumber = argv.build;

const codeDeployEnvs = {
    test: {
        applicationName: 'BLF_Test',
        deploymentGroupName: 'BLF_Test_In_Place'
    },
    live: {
        applicationName: 'BLF_Live',
        deploymentGroupName: 'BLF_Live_In_Place'
    }
};

const CONF = {
    s3Bucket: 'blf-travis-test',
    filenamePattern: /build-(\d+).zip/,
    codedeploy: (argv.l) ? codeDeployEnvs.live : codeDeployEnvs.test
};

// create AWS SDK instance
const credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
AWS.config.update({region:'eu-west-1'});
AWS.config.credentials = credentials;
const codedeploy = new AWS.CodeDeploy();

// do we have a build number?
if (customBuildNumber) {
    
    lookupRevisionAndDeploy(customBuildNumber); // try to deploy it!

} else { // ask for one instead

    // fetch recent revisions from TEST (eg. to promote to live or re-deploy)
    let getRevisions = codedeploy.listApplicationRevisions({
        applicationName: codeDeployEnvs.test.applicationName,
        deployed: 'ignore',
        s3Bucket: CONF.s3Bucket,
        sortBy: 'registerTime',
        sortOrder: 'descending'
    }).promise();

    // present past revisions to the user
    getRevisions.then((data) => {
        console.log('Listing the most recent revisions on TEST:\n');
        let revisions = data.revisions.slice(0, 10);
        let validDeploys = [];
        revisions.forEach(r => {
            let id = r.s3Location.key;
            let number = id.match(CONF.filenamePattern);
            if (number && number[1]) {
                validDeploys.push(parseInt(number[1]));
                console.log(`\t• Build #${number[1]}`);
            }
        });

        // prompt to ask which revision to deploy
        let promptSchema = {
            description: `\nWhich revision would you like to deploy to ${CONF.codedeploy.applicationName}?`,
            name: 'revisionId',
            type: 'integer',
            message: 'Please supply a valid deploy ID',
            required: true
        };

        prompt.start();

        // deploy a known revision
        prompt.get(promptSchema, (err, result) => {
            let typedId = result.revisionId;
            if (validDeploys.indexOf(typedId) !== -1) {
                // we know this is valid
                deployRevision(typedId);
            } else {
                // not sure about this, look it up
                console.log('That ID wasn\'t in the list, looking it up...');
                lookupRevisionAndDeploy(typedId);
            }
        });

    }).catch((err) => {
        console.error('Error fetching revisions', {
            error: err
        });
    });
}

// make JSON data for deploy config
function createDeploymentConf (id) {
    return {
        applicationName: CONF.codedeploy.applicationName,
        autoRollbackConfiguration: {
            enabled: true,
            events: ['DEPLOYMENT_FAILURE']
        },
        deploymentConfigName: 'CodeDeployDefault.OneAtATime',
        deploymentGroupName: CONF.codedeploy.deploymentGroupName,
        description: 'Automated deploy',
        fileExistsBehavior: 'OVERWRITE',
        ignoreApplicationStopFailures: false,
        revision: {
            revisionType: 'S3',
            s3Location: {
                bucket: CONF.s3Bucket,
                bundleType: 'zip',
                key: `build-${id}.zip`
            }
        },
        updateOutdatedInstancesOnly: false
    };
};

function deployRevision (id) {
    console.log(`Attempting to deploy revision ${id}, please wait...`);
    const deployParams = createDeploymentConf(id);
    let attemptDeploy = codedeploy.createDeployment(deployParams).promise();
    attemptDeploy.then((data) => {
        console.log('Deployment started, monitoring...');
        let deployCheck = codedeploy.waitFor('deploymentSuccessful', { deploymentId: data.deploymentId }).promise();
        deployCheck.then((data) => {
            console.log('Deployment succeeded!');
        }).catch((err) => {
            console.error('Error deploying revision', {
                deploymentId: data.deploymentId,
                error: err
            });
        });
    }).catch((err) => {
        console.error('Error creating deployment', {
            buildId: id,
            error: err
        });
    });
};

// lookup a known revision on TEST
function getRevision (id) {
    return codedeploy.getApplicationRevision({
        applicationName: codeDeployEnvs.test.applicationName,
        revision: {
            revisionType: 'S3',
            s3Location: {
                bucket: CONF.s3Bucket,
                bundleType: 'zip',
                key: `build-${id}.zip`
            }
        }
    }).promise();

}

function lookupRevisionAndDeploy (id) {
    getRevision(id).then((response) => {
        console.log('Found your revision ID! Deploying it now...');
        deployRevision(id);
    }).catch((err) => {
        console.error('Error! That ID didn\'t exist. Sorry :(');
    });
}

