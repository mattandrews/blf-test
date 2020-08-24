# Monitoring

We use a couple of services for monitoring beyond what AWS gives you by default.

## Logging

All EC2 instances have the CloudWatch agent installed allowing us to push logs to CloudWatch logs. These logs can either be viewed through the AWS console or (for production logs) through [DataDog](https://www.datadoghq.com/).

We monitor the following log sources:

-   EC2 memory usage
-   Nginx error logs
-   ClamAV logs (antivirus)

We also use [Winston](https://github.com/winstonjs/winston) to log directly to CloudWatch from within our app. We use these logs to power internal dashboards to show key statistics about the health of the app.

## Sentry

We also have [Sentry](https://sentry.io/) configured for both client-side and server-side code which provides us with real time monitoring of application errors.
