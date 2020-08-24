# Secrets
The web app uses AWS Parameter Store to store application secrets such as database credentials, API keys, and other secure data which should not be stored in source control.

This means that adding a new secret or updating one requires logging into the AWS control panel and creating/updating it, and then triggering a deploy. 

The secrets are fetched via the `./bin/get-secrets` script, which passes through a `--environment` argument to define which set to use. This runs during each deploy.

## Adding a secret

Log into the AWS control panel and search for the Parameter Store tool (which lives within Systems Manager). You should see a set of parameters with names like the following:

    /Web/Global/bank.api.key
    /Web/Prod/pastgrants.api.uri
    /Web/Test/db.connection-uri
    
The naming convention for these secrets is like so:

    /<Platform>/<Environment>/<Key>
    
In practice, Platform is always `Web`, and Environment is always `Test`, `Prod` or `Global` – the latter refers to an environment-wide secret. We don't need `Dev` as you can override most secrets using your local `.env` file. Key names themselves should use `.`s to separate names, eg. `bank.api.key`.

Each secret is a `SecureString`, meaning the secret's value is encrypted. When we fetch the application secrets, the script decrypts them before writing them out to disk as JSON.

After adding a new secret, you'll need to edit `common/secrets.js` and add a line similar to this:

    const DB_CONNECTION_URI = 
        process.env.DB_CONNECTION_URI || getParameter('db.connection-uri', true);
        
    ...
        
    module.exports = {
        DB_CONNECTION_URI,
        ...
    };
        
This will first look in the process's environment (eg. `.env`) for a secret, allowing you to override them locally, and then will fall back to `getParameter()`, which looks up a secret by its `Key` (see above), from the secrets file the app was loaded with (`/etc/blf/parameters.json`, or `$SECRET_DIR/parameters.json` on Windows). The `true` parameter above is for `shouldThrowIfMissing` – eg. if this parameter can't be found, the app should fail to start. This should only be used for hard requirements (eg. which Travis CI should use).

You should then be able to use your secret around the app.

## Other considerations

The above approach is slightly fiddly and we've sometimes run into issues with the Parameter Store API which only fetches 50 secrets at a time – occasionally we've exceeded this number and had to remove (unused) secrets.

Since we implemented the above process, AWS has released Secrets Manager which is specifically designed for this task. It incurs a small fee for each retrieval of secrets, but the key difference is that a secret here can contain multiple values (like a JSON object), so we’re able to keep all of the CMS’s config items in a per-environment secret. This means we only have three secrets for the CMS (rather than 30 or so which we have for the website) – global, test and production. Within the test/production secrets we override some of the global parameters.

It would be worth exploring moving this web app to follow the above approach as used in the CMS. The `get-secrets` script will need to be updated to match the CMS pattern, but the improvements to workflow are worth the change.
