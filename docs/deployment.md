# Deployment

## Test environment

Deployments to the test environment are triggered each time a change is merged to `master`. Once a change is merged, Travis will build and deploy it automatically.

## Production environment

**Deploys to production are manual**. Once a deploy has been checked on the test environment it can be advanced to production via AWS CodeDeploy, either by using the web console, or the bundled deploy script within the app:

```shell script
./bin/deploy --live
```

This command will begin a deployment by listing the previous 10 releases deployed to the test environment and asking which build you wish to deploy. It will provide you with a GitHub diff link for the changes that are going to be deployed, and will ask you to confirm if you wish to proceed. Progress updates can be followed in the AWS console, as the deployment proceeds.
