# GitHub Secrets & Environments

Add all secrets at **Settings → Secrets and variables → Actions → New repository secret**.

---

## Repository Secrets (shared across environments)

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `AWS_ACCESS_KEY_ID` | IAM access key for deployments | AWS IAM console → your deploy user |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | AWS IAM console → your deploy user |
| `VERCEL_TOKEN` | Vercel personal access token | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel team/org ID | `vercel whoami` or project dashboard |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` after first `vercel link` |

---

## Environment-Specific Secrets

Create two environments: **staging** and **production**
(Settings → Environments → New environment)

### `staging` environment

| Secret | Example value |
|--------|---------------|
| `COGNITO_USER_POOL_ID` | `ap-south-1_xxxxxxxx` |
| `COGNITO_CLIENT_ID` | `xxxxxxxxxxxx` |
| `OPENSEARCH_ENDPOINT` | `https://xxxx.aoss.amazonaws.com` |
| `OPENSEARCH_INDEX` | `menu-embeddings-dev` |
| `WEATHER_API_KEY` | `your-openweather-key` |
| `WEBSOCKET_API_ID` | `xxxxxxxxxx` |
| `VITE_API_URL` | `https://xxxxxx-dev.execute-api.ap-south-1.amazonaws.com/dev` |
| `VITE_WS_URL` | `wss://xxxxxx.execute-api.ap-south-1.amazonaws.com/dev` |
| `VITE_AI_ENABLED` | `true` |

### `production` environment

| Secret | Example value |
|--------|---------------|
| `COGNITO_USER_POOL_ID` | `ap-south-1_yyyyyyyy` |
| `COGNITO_CLIENT_ID` | `yyyyyyyyyyyy` |
| `OPENSEARCH_ENDPOINT` | `https://yyyy.aoss.amazonaws.com` |
| `OPENSEARCH_INDEX` | `menu-embeddings` |
| `WEATHER_API_KEY` | `your-openweather-key` |
| `WEBSOCKET_API_ID` | `yyyyyyyyyy` |
| `VITE_API_URL` | `https://yyyyyy.execute-api.ap-south-1.amazonaws.com/prod` |
| `VITE_WS_URL` | `wss://yyyyyy.execute-api.ap-south-1.amazonaws.com/prod` |
| `VITE_AI_ENABLED` | `true` |

---

## Required IAM Permissions for Deploy User

The IAM user referenced by `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "cloudformation:*", "Resource": "*" },
    { "Effect": "Allow", "Action": "lambda:*",         "Resource": "*" },
    { "Effect": "Allow", "Action": "apigateway:*",     "Resource": "*" },
    { "Effect": "Allow", "Action": "s3:*",             "Resource": "*" },
    { "Effect": "Allow", "Action": "iam:*",            "Resource": "*" },
    { "Effect": "Allow", "Action": "logs:*",           "Resource": "*" },
    { "Effect": "Allow", "Action": "dynamodb:*",       "Resource": "*" },
    { "Effect": "Allow", "Action": "cognito-idp:*",    "Resource": "*" }
  ]
}
```

> Tip: Scope the `Resource` ARNs to your specific tables/functions in production for least-privilege.
