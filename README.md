# Dataset Viewer & Analytics

A full-stack web application for uploading, storing, and analyzing CSV datasets in the cloud using AWS infrastructure.

## Features

- **Direct S3 Uploads:** Streams files directly to AWS S3 using Multer memory storage.
- **Automated CSV Analytics:** Parses files on the fly to compute row/column counts, dynamic headers, and statistical summaries.
- **Relational Metadata:** Stores processed dataset statistics in AWS RDS (MySQL).
- **Production-Ready Deployment:** Hosted on AWS EC2 behind an Nginx reverse proxy with PM2 process management.

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Dashboard & Analytics Modal)
- **Backend:** Node.js, Express.js, Multer, `csv-parser`
- **Database:** AWS RDS (MySQL)
- **Cloud Storage:** AWS S3
- **Infrastructure:** AWS EC2 (Ubuntu 24.04), Nginx, PM2

## Getting Started

### Prerequisites

- Node.js (v20+)
- AWS Account (S3 Bucket, RDS MySQL Instance, EC2 Instance with S3 IAM Role)

### Environment Setup

Create a `.env` file in the root directory:

```env
PORT=5000
STORAGE_TYPE=s3

# RDS MySQL Database
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your_rds_password
DB_NAME=dataset_viewer

# AWS S3 Storage
AWS_REGION=your-aws-region
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### Installation & Local Run

1. Clone the repository:

```bash
git clone [https://github.com/your-username/dataset-viewer.git](https://github.com/your-username/dataset-viewer.git)
cd dataset-viewer
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

## Production Deployment (AWS EC2)

1. SSH into your EC2 instance and clone the repository.
2. Configure `.env` with production RDS and S3 credentials.
3. Run the app with PM2:

```bash
pm2 start server.js --name "dataset-viewer"
pm2 save

pm2 startup
# run the command returned by the terminal
```

4. Configure Nginx as a reverse proxy pointing port `80` to `http://127.0.0.1:5000`.
