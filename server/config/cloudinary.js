/**
 * Cloudinary Configuration
 *
 * Sign up at https://cloudinary.com (free tier: 25GB storage)
 * Add these to your .env file on Render:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Equipment image storage
const equipmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'm77ag/equipment',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 900, crop: 'limit', quality: 'auto' }
    ]
  }
});

// General image storage
const generalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'm77ag/general',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 900, crop: 'limit', quality: 'auto' }
    ]
  }
});

// Multer upload instances
const uploadEquipment = multer({
  storage: equipmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadGeneral = multer({
  storage: generalStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  const publicId = `${folder}/${filename.split('.')[0]}`;
  return publicId;
};

module.exports = {
  cloudinary,
  uploadEquipment,
  uploadGeneral,
  deleteImage,
  getPublicIdFromUrl
};
