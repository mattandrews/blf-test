# Getting started

## Prerequisites

You'll need the following tools installed in order to run the project locally:

-   Node.js v12+
-   MySQL v5.7+
-   [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) configured on your machine

You will also need a modern, Bash-like terminal app. On Windows, Git Bash is recommended.

Once you have the prerequisites installed on your machine, and have the project checked out locally, run these commands in your terminal of choice:

## Install dependencies

From the root of the project run:

```shell script
npm install
```

## Download application secrets

Next, you'll need to download the application secrets. These are configuration settings that allow the application to external services like a database or email sending service.

Create a directory called `/etc/blf/` and make sure it is writeable. This is where application secrets will be stored.

**Optional**: for Windows users, you can override the location of this directory by setting an environment variable like so:

```
SECRET_DIR=C:/Users/Someone/FolderName
```

Make sure this directory exists, eg.

```shell script
mkdir -p /etc/blf
```

Next, fetch the secrets. You'll need to ask a mmember of the team to grant you the appropriate AWS permissions otherwise this step will fail.

```shell script
./bin/get-secrets
```

## Create a local `.env` file

This is used to set local configuration values. There is a `.env.sample` file at the root of the project which documents available options. You should make a copy of this as `.env`.

At a minimum you need to set a `DB_CONNECTION_URI` value to point to a local database instance. This can be a SQLite database in development but we recommend setting up a local MySQL instance for parity with production.

## Run a build

Before starting the application, run a build. This makes sure all client-side assets are compiled.

```shell script
npm run build
```

## Start the application

This command runs the app through `nodemon` with debugging enabled. Changes to server-side code will be automatically applied when you reload. If you add `SHOW_RESTART_NOTIFICATION=true` to your `.env` file you'll get a native system notification when the app has reloaded (which takes a few seconds).

```shell script
npm run start-dev
```

## Watch for front-end changes

If you wish for CSS and JavaScript files to be recompiled automatically when working, run the following command in another terminal:

```shell script
npm run watch
```

When you reload your web browser, you should see the latest CSS/JS changes.


## IDE / text editor configuration

It's recommended that you use [prettier](https://prettier.io/)  and [ESLint](https://eslint.org/) with whatever editor/IDE you use – the settings for both are contained within the app (eg. `package.json` for Prettier and `.eslintrc.js` for ESLint). Ideally you should configure your editor to apply Prettier's rules when saving files locally (so you can never commit anything with non-standard formatting), and to flag ESLint violations within your editor – again, so you can fix them before the build runs and fails.

We also have an `.editorconfig` file to define common things like spacing, newlines, etc. It's recommended to use this too (where your editor supports it) to ensure the team is working to the same code style.
