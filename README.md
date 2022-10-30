# notion-utils

Some services that you can run in the background to improve your notion
workflow.

Is this intuitive to use? Absolutely not (at the moment). I just want to share
some of the things I created to make my life on Notion a little bit easier. It
definitely requires some work to get running on your own workspace if you'd
like to use it.

## Installation and Usage

Make sure to create an integration with Notion [here](https://www.notion.so/my-integrations),
and save the token for later.

### Building

Before you can run any of the services, you need to make sure to run
`yarn` to install any of the dependencies.

Then, you can choose to build every service:

```
yarn build
```

... or build specific ones:

```
yarn workspace @notion-utils/<service> build
```

The `services` folder contains a list of services that you can run.

### Running a service

After you have built the services, you can run them using:

```
yarn workspace @notion-utils/<service> start
```

The steps above simply run the service on your machine. You may want to deploy
some services on a machine where it will be up 24/7.
