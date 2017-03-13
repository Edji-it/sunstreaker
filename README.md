# Sunstreaker (Edji File Upload Server)

## Quick Start

### Install Homebrew

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

### Install Environment and Package Manager

```bash
brew install node yarn
```

### Clone the repo

Clone with HTTPS: `https://github.com/codiak/sunstreaker.git`

Clone with SSH: `git@github.com:codiak/sunstreaker.git`

### Install More Packages

```bash
yarn install
yarn global add mocha
```

## Heroku

Add the remotes
```bash
git remote add prod https://git.heroku.com/sunstreaker.git
```

Push to `dev` and `prod`
```bash
git push prod master
```


Swap the default Heroku CLI remote
```bash
git config heroku.remote dev
git config heroku.remote prod
```

## Testing

Testing is automatid with Mocha, and run with Yarn scripts.

### Run the test suite against a local instance of the server

In order to accomplish this, you must first have a copy of the AWS keys locally, in the root of the project. The file should be named `.aws-keys.json` and have properties `accessKeyId` and `secretAccessKey`

Run the server from a terminal. From another terminal, run
```bash
yarn test
```

### Run the test suite against the Heroku services (do NOT do this please! we don't have a dev instance set up to test against)

From a terminal, run
```bash
yarn test:dev
```