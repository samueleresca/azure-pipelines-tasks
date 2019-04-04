"use strict";

import tl = require('vsts-task-lib/task');
import { Kubectl } from "kubernetes-common/kubectl-object-model";
import * as utils from "../utils/utilities";
import * as TaskInputParameters from '../models/TaskInputParameters';

export async function createSecret() {
    let args = "";
    if (utils.isEqual(TaskInputParameters.secretType, "dockerRegistry", utils.StringComparer.OrdinalIgnoreCase)) {
        args = getDockerRegistrySecretArgs();
    }
    else {
        args = getGenericSecretArgs();
    }

    let kubectl = new Kubectl(await utils.getKubectl(), TaskInputParameters.namespace);
    var result = kubectl.createSecret(args, true, TaskInputParameters.secretName.trim());
    utils.checkForErrors([result]);
}

let getDockerRegistrySecretArgs = () => {
    var registryType = tl.getInput("containerRegistryType", true);
    if (registryType === "Azure Container Registry") {
        let spnId = tl.getEndpointAuthorizationParameter(TaskInputParameters.dockerRegistryEndpoint, 'serviceprincipalid', true);
        let spnKey = tl.getEndpointAuthorizationParameter(TaskInputParameters.dockerRegistryEndpoint, 'serviceprincipalkey', true);
        let loginServer = tl.getEndpointAuthorizationParameter(TaskInputParameters.dockerRegistryEndpoint, "loginServer", true);
        return `docker-registry ${TaskInputParameters.secretName.trim()} --docker-username=${spnId} --docker-password=${spnKey} --docker-server=${loginServer} --docker-email=ServicePrincipal@AzureRM`;
    }
    else {
        let dockerRegistryAuth = tl.getEndpointAuthorization(TaskInputParameters.dockerRegistryEndpoint, false).parameters;
        return `docker-registry ${TaskInputParameters.secretName.trim()} --docker-username=${dockerRegistryAuth["username"]} --docker-password=${dockerRegistryAuth["password"]} --docker-server=${dockerRegistryAuth["registry"]} --docker-email=${dockerRegistryAuth["email"]}`;
    }
}

let getGenericSecretArgs = () => {
    return `generic ${TaskInputParameters.secretName.trim()} ${TaskInputParameters.secretArguments}`
}