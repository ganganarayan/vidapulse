-- 027: Cap Pro plan at 20 videos (previously unlimited / NULL)
UPDATE plans SET video_limit = 20 WHERE name = 'pro';
