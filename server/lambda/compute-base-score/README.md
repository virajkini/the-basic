# compute-base-score Lambda

Nightly (or on-demand) job that computes `base_score` and `score_computed_at` on every profile.

## Formula

`base_score = 0.35 × photo_score + 0.40 × social_score + 0.25 × recency_score`

## AWS Lambda configuration

| Setting | Recommendation |
|--------|----------------|
| **Runtime** | Node.js 20.x or 22.x |
| **Handler** | `index.handler` |
| **Timeout** | 5–15 minutes (S3 list + bulk write for all profiles) |
| **Memory** | 512 MB–1024 MB |
| **Trigger** | EventBridge schedule (e.g. `cron(0 2 * * ? *)` — 2 AM UTC daily) |

## Environment variables (Lambda console)

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=...` | MongoDB connection string (Atlas or self-hosted). |

### Recommended

| Variable | Example | Description |
|----------|---------|-------------|
| `MONGODB_DB_NAME` | `amgeljodi` | Database name. Omit only if you rely on `APP_ENV` defaults below. |
| `S3_BUCKET_NAME` | `amgel-jodi-s3` | Bucket containing `profiles/{userId}/original/` photos. |
| `APP_ENV` | `prod` or `stage` | When `MONGODB_DB_NAME` is unset: `prod` → `amgeljodi`, `stage` → `amgeljodi_stage`. |

### Optional (usually omit on Lambda)

| Variable | Notes |
|----------|--------|
| `AWS_REGION` | Set automatically by Lambda (`ap-south-1` if that's your region). Only override if needed. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | **Do not set** — use the Lambda execution role for S3 instead. |

## IAM permissions (execution role)

Attach a policy like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::amgel-jodi-s3",
      "Condition": {
        "StringLike": { "s3:prefix": ["profiles/*"] }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::amgel-jodi-s3"
    }
  ]
}
```

MongoDB Atlas: allow the Lambda’s **egress IP** (NAT Gateway / fixed IP) or run Lambda in a **VPC** with Atlas VPC peering / private endpoint.

## Deploy zip

From this directory:

```bash
npm install --omit=dev
zip -r compute-base-score.zip index.js node_modules package.json
```

Upload `compute-base-score.zip` to Lambda (or use your CI/CD).

## Local run

From `server/` (uses `server/.env`):

```bash
npm run compute:base-score
```
