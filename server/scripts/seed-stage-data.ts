import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_ENV, IS_STAGE, MONGODB_DB_NAME } from '../src/config/appEnv.js';

dotenv.config();

if (!IS_STAGE) {
  console.error('This script only runs with APP_ENV=stage.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amgel-jodi-s3';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const s3ClientConfig: {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
} = { region: AWS_REGION };

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3ClientConfig);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

type Gender = 'M' | 'F';
type WorkingStatus = 'employed' | 'self-employed' | 'not-working';

interface SeedProfile {
  index: number;
  phone: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  nativePlace: string;
  height: string;
  heightCm: number;
  workingStatus: WorkingStatus;
  company?: string;
  designation?: string;
  workLocation?: string;
  salaryRange?: '<5L' | '5-15L' | '15-30L' | '30-50L' | '>50L';
  education: string;
  aboutMe: string;
  placeOfBirth: string;
  birthTiming: string;
  gothra: string;
  nakshatra: string;
}

const stageProfiles: SeedProfile[] = [
  { index: 1, phone: '918892043505', firstName: 'Chetana', lastName: 'Shetty', gender: 'F', dob: '1998-04-12', nativePlace: 'Mumbai', height: `5'4" (163 cm)`, heightCm: 163, workingStatus: 'employed', company: 'Infosys', designation: 'Product Analyst', workLocation: 'Mumbai', salaryRange: '5-15L', education: 'B.E. Computer Science', aboutMe: 'Family-oriented and enjoys music, travel, and quiet weekends.', placeOfBirth: 'Mangalore', birthTiming: '08:15', gothra: 'Kashyapa', nakshatra: 'Rohini' },
  { index: 2, phone: '918892043506', firstName: 'Raksha', lastName: 'Pai', gender: 'F', dob: '1997-09-03', nativePlace: 'Bangalore', height: `5'5" (165 cm)`, heightCm: 165, workingStatus: 'employed', company: 'TCS', designation: 'UX Designer', workLocation: 'Bangalore', salaryRange: '5-15L', education: 'B.Des', aboutMe: 'Calm, practical, and close to family. Loves cooking and temple visits.', placeOfBirth: 'Udupi', birthTiming: '06:40', gothra: 'Bharadwaja', nakshatra: 'Swati' },
  { index: 3, phone: '918892043507', firstName: 'Archana', lastName: 'Rao', gender: 'F', dob: '1999-01-28', nativePlace: 'Goa', height: `5'3" (160 cm)`, heightCm: 160, workingStatus: 'self-employed', company: 'Independent', designation: 'Interior Consultant', workLocation: 'Goa', salaryRange: '5-15L', education: 'B.Com', aboutMe: 'Warm, creative, and values honesty and simple living.', placeOfBirth: 'Karwar', birthTiming: '11:05', gothra: 'Vashishta', nakshatra: 'Anuradha' },
  { index: 4, phone: '918892043508', firstName: 'Kavya', lastName: 'Bhat', gender: 'F', dob: '1996-07-17', nativePlace: 'Mysore', height: `5'6" (168 cm)`, heightCm: 168, workingStatus: 'employed', company: 'Accenture', designation: 'HR Specialist', workLocation: 'Mysore', salaryRange: '5-15L', education: 'MBA', aboutMe: 'Enjoys reading, long drives, and staying rooted in tradition.', placeOfBirth: 'Shimoga', birthTiming: '09:25', gothra: 'Koundinya', nakshatra: 'Hasta' },
  { index: 5, phone: '918892043509', firstName: 'Nandini', lastName: 'Hegde', gender: 'F', dob: '1995-12-06', nativePlace: 'Hubli', height: `5'4" (162 cm)`, heightCm: 162, workingStatus: 'employed', company: 'Wipro', designation: 'QA Lead', workLocation: 'Pune', salaryRange: '15-30L', education: 'B.E. Information Science', aboutMe: 'Straightforward, affectionate, and enjoys family gatherings.', placeOfBirth: 'Hubli', birthTiming: '14:10', gothra: 'Atri', nakshatra: 'Uttara Phalguni' },
  { index: 6, phone: '918892043510', firstName: 'Pooja', lastName: 'Kulkarni', gender: 'F', dob: '1998-11-14', nativePlace: 'Belgaum', height: `5'2" (157 cm)`, heightCm: 157, workingStatus: 'not-working', education: 'M.Sc. Mathematics', aboutMe: 'Simple, spiritual, and interested in teaching after marriage.', placeOfBirth: 'Belgaum', birthTiming: '07:50', gothra: 'Agastya', nakshatra: 'Pushya' },
  { index: 7, phone: '918892043511', firstName: 'Sneha', lastName: 'Acharya', gender: 'F', dob: '1997-03-22', nativePlace: 'Chennai', height: `5'5" (164 cm)`, heightCm: 164, workingStatus: 'employed', company: 'Zoho', designation: 'Software Engineer', workLocation: 'Chennai', salaryRange: '15-30L', education: 'B.Tech IT', aboutMe: 'Balanced, cheerful, and values communication and mutual respect.', placeOfBirth: 'Chennai', birthTiming: '05:35', gothra: 'Vatsa', nakshatra: 'Revati' },
  { index: 8, phone: '918892043512', firstName: 'Vaishnavi', lastName: 'Kamath', gender: 'F', dob: '1999-08-30', nativePlace: 'Manipal', height: `5'4" (161 cm)`, heightCm: 161, workingStatus: 'employed', company: 'Deloitte', designation: 'Audit Associate', workLocation: 'Hyderabad', salaryRange: '5-15L', education: 'B.Com', aboutMe: 'Soft-spoken, organized, and enjoys devotional music.', placeOfBirth: 'Udupi', birthTiming: '10:55', gothra: 'Kashyapa', nakshatra: 'Mrigashira' },
  { index: 9, phone: '918892043513', firstName: 'Suhas', lastName: 'Mallya', gender: 'M', dob: '1994-02-11', nativePlace: 'Pune', height: `5'9" (175 cm)`, heightCm: 175, workingStatus: 'employed', company: 'Capgemini', designation: 'Engineering Manager', workLocation: 'Pune', salaryRange: '15-30L', education: 'B.E. Mechanical', aboutMe: 'Grounded, dependable, and interested in a family-first partnership.', placeOfBirth: 'Udupi', birthTiming: '13:20', gothra: 'Bharadwaja', nakshatra: 'Shravana' },
  { index: 10, phone: '918892043514', firstName: 'Ninaad', lastName: 'Prabhu', gender: 'M', dob: '1997-10-09', nativePlace: 'Chennai', height: `5'10" (178 cm)`, heightCm: 178, workingStatus: 'self-employed', company: 'Own Business', designation: 'Restaurant Owner', workLocation: 'Chennai', salaryRange: '15-30L', education: 'BBA', aboutMe: 'Energetic, ambitious, and close to his extended family.', placeOfBirth: 'Mangalore', birthTiming: '16:05', gothra: 'Koundinya', nakshatra: 'Ashwini' },
  { index: 11, phone: '918892043515', firstName: 'Ashish', lastName: 'Deshpande', gender: 'M', dob: '1996-05-19', nativePlace: 'Delhi', height: `5'8" (173 cm)`, heightCm: 173, workingStatus: 'employed', company: 'Amazon', designation: 'Operations Lead', workLocation: 'Delhi', salaryRange: '15-30L', education: 'B.Tech', aboutMe: 'Practical, respectful, and enjoys travel with family.', placeOfBirth: 'Dharwad', birthTiming: '07:15', gothra: 'Atri', nakshatra: 'Punarvasu' },
  { index: 12, phone: '918892043516', firstName: 'Aditya', lastName: 'Joshi', gender: 'M', dob: '1995-01-04', nativePlace: 'Bangalore', height: `5'11" (180 cm)`, heightCm: 180, workingStatus: 'employed', company: 'Oracle', designation: 'Data Engineer', workLocation: 'Bangalore', salaryRange: '15-30L', education: 'M.Tech', aboutMe: 'Quietly confident, values commitment, and likes structured planning.', placeOfBirth: 'Mysore', birthTiming: '12:45', gothra: 'Vashishta', nakshatra: 'Dhanishta' },
  { index: 13, phone: '918892043517', firstName: 'Rohan', lastName: 'Shenoy', gender: 'M', dob: '1998-06-25', nativePlace: 'Kochi', height: `5'9" (176 cm)`, heightCm: 176, workingStatus: 'employed', company: 'EY', designation: 'Consultant', workLocation: 'Kochi', salaryRange: '5-15L', education: 'B.Com', aboutMe: 'Friendly, thoughtful, and enjoys weekend sports and family dinners.', placeOfBirth: 'Kasaragod', birthTiming: '09:05', gothra: 'Agastya', nakshatra: 'Chitra' },
  { index: 14, phone: '918892043518', firstName: 'Kiran', lastName: 'Bhandary', gender: 'M', dob: '1994-09-18', nativePlace: 'Mangalore', height: `5'7" (171 cm)`, heightCm: 171, workingStatus: 'self-employed', company: 'Family Business', designation: 'Business Partner', workLocation: 'Mangalore', salaryRange: '15-30L', education: 'BBM', aboutMe: 'Simple lifestyle, community-oriented, and values mutual respect.', placeOfBirth: 'Mangalore', birthTiming: '18:00', gothra: 'Kashyapa', nakshatra: 'Uttara Ashadha' },
  { index: 15, phone: '918892043519', firstName: 'Pranav', lastName: 'Rao', gender: 'M', dob: '1997-12-01', nativePlace: 'Hyderabad', height: `5'10" (177 cm)`, heightCm: 177, workingStatus: 'employed', company: 'Microsoft', designation: 'Software Engineer', workLocation: 'Hyderabad', salaryRange: '15-30L', education: 'B.E. Electronics', aboutMe: 'Calm, focused, and looking for a supportive long-term relationship.', placeOfBirth: 'Hyderabad', birthTiming: '06:25', gothra: 'Vatsa', nakshatra: 'Moola' },
];

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function listImageFiles(dirName: 'pic_female' | 'pic_male'): Promise<string[]> {
  const dirPath = path.join(repoRoot, dirName);
  const entries = await fs.readdir(dirPath);
  return entries
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .sort()
    .map((name) => path.join(dirPath, name));
}

function buildUserId(index: number): string {
  return `u_stage_${String(index).padStart(3, '0')}`;
}

async function uploadImageVariants(userId: string, sourceFile: string): Promise<string[]> {
  const body = await fs.readFile(sourceFile);
  const ext = path.extname(sourceFile).toLowerCase();
  const contentType = getContentType(sourceFile);
  const baseFileName = `seed-${path.basename(sourceFile, ext).replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase()}${ext}`;
  const folders: Array<'original' | 'compressed' | 'blurred'> = ['original', 'compressed', 'blurred'];

  const uploadedKeys: string[] = [];
  for (const folder of folders) {
    const key = `profiles/${userId}/${folder}/${baseFileName}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    uploadedKeys.push(key);
  }

  return uploadedKeys;
}

async function seed() {
  const femaleImages = await listImageFiles('pic_female');
  const maleImages = await listImageFiles('pic_male');

  if (femaleImages.length === 0 || maleImages.length === 0) {
    throw new Error('Source images were not found in pic_female or pic_male');
  }

  const mongoClient = new MongoClient(MONGODB_URI!);
  await mongoClient.connect();

  try {
    const db = mongoClient.db(MONGODB_DB_NAME);
    const users = db.collection('users');
    const profiles = db.collection('profiles');
    const quotas = db.collection('connection_quotas');

    console.log(`Seeding ${stageProfiles.length} profiles into ${MONGODB_DB_NAME} (${APP_ENV})`);

    for (const profile of stageProfiles) {
      const userId = buildUserId(profile.index);
      const imagePool = profile.gender === 'F' ? femaleImages : maleImages;
      const imagePath = imagePool[(profile.index - 1) % imagePool.length];
      const now = new Date();

      await users.updateOne(
        { _id: userId },
        {
          $set: {
            phone: profile.phone,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

      await profiles.updateOne(
        { _id: userId },
        {
          $set: {
            creatingFor: 'self',
            firstName: profile.firstName,
            lastName: profile.lastName,
            name: `${profile.firstName} ${profile.lastName}`,
            dob: profile.dob,
            gender: profile.gender,
            nativePlace: profile.nativePlace,
            height: profile.height,
            heightCm: profile.heightCm,
            workingStatus: profile.workingStatus,
            company: profile.company,
            designation: profile.designation,
            workLocation: profile.workLocation,
            salaryRange: profile.salaryRange,
            education: profile.education,
            aboutMe: profile.aboutMe,
            placeOfBirth: profile.placeOfBirth,
            birthTiming: profile.birthTiming,
            gothra: profile.gothra,
            nakshatra: profile.nakshatra,
            verified: true,
            subscribed: true,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

      await quotas.updateOne(
        { _id: userId },
        {
          $set: {
            dailyCount: 0,
            dailyResetDate: now.toISOString().split('T')[0],
            dailyLimit: 2,
            totalAvailable: 20,
            totalUsed: 0,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

      const uploadedKeys = await uploadImageVariants(userId, imagePath);
      console.log(`Seeded ${userId} (${profile.phone}) using ${path.basename(imagePath)} -> ${uploadedKeys.length} objects`);
    }

    console.log('Stage seed completed successfully.');
  } finally {
    await mongoClient.close();
  }
}

seed().catch((error) => {
  console.error('Failed to seed stage data:', error);
  process.exit(1);
});
