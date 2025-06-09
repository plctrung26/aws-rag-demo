import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import path = require('path');

export class AmplifyChatuiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -------------------------------------------------------------------------
    // Load SSM parameters

    const cognito_user_pool_id_parameter = ssm.StringParameter.valueForStringParameter(
      this, "/AgenticLLMAssistant/cognito_user_pool_id"
    );

    const cognito_user_pool_client_id_parameter = ssm.StringParameter.valueForStringParameter(
      this, "/AgenticLLMAssistant/cognito_user_pool_client_id"
    );

    const agent_api_parameter = ssm.StringParameter.valueForStringParameter(
      this, "/AgenticLLMAssistant/agent_api"
    );

    // -------------------------------------------------------------------------
    // Deploy using local build output (no CodeCommit needed)

    const amplifyChatUI = new amplify.App(this, 'AmplifyChatUI', {
      autoBranchDeletion: true,
      sourceCodeProvider: new amplify.AssetSourceCodeProvider({
        asset: cdk.aws_s3_assets.Asset.fromPath(path.join(__dirname, '../../frontend/out')), // or 'build' or '.next'
      }),
      platform: amplify.Platform.WEB_COMPUTE, // SSR support
      environmentVariables: {
        '_CUSTOM_IMAGE': 'amplify:al2023',
        'AMPLIFY_USERPOOL_ID': cognito_user_pool_id_parameter,
        'COGNITO_USERPOOL_CLIENT_ID': cognito_user_pool_client_id_parameter,
        'API_ENDPOINT': agent_api_parameter
      },
    });

    amplifyChatUI.addBranch('main', {
      stage: "PRODUCTION",
    });

    // -----------------------------------------------------------------------
    // Outputs

    new cdk.CfnOutput(this, "AmplifyAppURL", {
      value: amplifyChatUI.defaultDomain,
    });
  }
}
