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
`yarn install`. This will simply install the `eslint` plugins.

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

## Deploying a service

The steps above simply run the service on your machine. You probably want to
run it on a machine that will be up 24/7.

There are some sample configuration files in `services/<service>/deployment`
that you can use out of the box. They are meant to be used with the Google
Cloud Platform using the Cloud Build API and the Kubernetes Engine.

The steps below will outline how to use these configuration files.

**If you're using these configuration files, it will be up to you to manage
resource allocation, service updates, etc. You are responsible for the
deployment and any costs associated with it.**

### Setting up

1. Clone / fork this repository

2. Create a new project on the
   [Google Cloud Platform Console](https://console.cloud.google.com/).

3. Enable the Kubernetes Engine API and the Cloud Build API.

### Setting up a Kubernetes Cluster

1. Create a new cluster. Use GKE Standard. You can leave the settings at
   default and change the name.

2. You'll need to add your Notion integration token as a secret. Go to your
   cluster, then go to Connect > Run in Cloud Shell

   ![image](https://user-images.githubusercontent.com/33074023/128647458-8cf71cf8-50d6-4c8d-94ff-3c20e0eb83e7.png)
   ![image](https://user-images.githubusercontent.com/33074023/128647493-4614926a-02bc-4b13-9b45-e2f1b65aaf9f.png)

3. Run the following command:

   ```
   kubectl create secret generic notion-secrets --from-literal notion-token=<notion_integration_token>
   ```

   When a container for a service runs, it will use the secret defined by this
   command as an environment variable. See the `kubernetes-resource.yml` file.

### Setting up the build trigger on Cloud Build

1. Create a new trigger

2. Set the Repository event to "Push to a branch"

3. Set the source of the trigger to point to your cloned / forked GitHub repo.

4. Feel free to set up a glob pattern to define which file changes will
   trigger the build. I recommend setting up a pattern that only triggers on
   a change to the specific service. e.g. `**/<service>/**`.

5. Under Configuration, set Type to "Cloud Build configuration file" and the
   "Cloud Build configuration file location" to
   `services/<service>/deployment/cloud-build.yml`

6. Save the trigger

Now, hitting "Run" should build the Docker image for the service, and deploy
the container to your Kubernetes cluster! If you want to add more services to
your cluster, just create new triggers for each of them.

Note that every time you push to the branch specified in the trigger, Cloud
Build will build the updated source code, and deploy it.
