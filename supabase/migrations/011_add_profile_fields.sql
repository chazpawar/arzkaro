-- Add new profile fields: DOB, Gender, Socials, Interests
-- Migration: 011_add_profile_fields.sql

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS instagram VARCHAR(255),
ADD COLUMN IF NOT EXISTS youtube VARCHAR(255),
ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255),
ADD COLUMN IF NOT EXISTS twitter VARCHAR(255),
ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth (non-editable after set)';
COMMENT ON COLUMN profiles.gender IS 'User gender (non-editable after set)';
COMMENT ON COLUMN profiles.instagram IS 'Instagram profile URL';
COMMENT ON COLUMN profiles.youtube IS 'YouTube channel URL';
COMMENT ON COLUMN profiles.linkedin IS 'LinkedIn profile URL';
COMMENT ON COLUMN profiles.twitter IS 'Twitter/X profile URL';
COMMENT ON COLUMN profiles.interests IS 'Array of user interests (e.g., Travel, Music, Party)';

-- Create index on interests for faster searching
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING GIN (interests);

-- Add check constraint for gender values
ALTER TABLE profiles
ADD CONSTRAINT check_gender
CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say'));
