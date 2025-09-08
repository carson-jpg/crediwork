import bcrypt from 'bcryptjs';

async function debugPassword() {
  try {
    const plainPassword = 'Admin123!';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    console.log('Plain password:', plainPassword);
    console.log('Generated hash:', hashedPassword);

    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Self-comparison result:', isValid);

    // Test with the hash from database
    const dbHash = '$2a$12$AV.ohqs9hbFzS6P/sbdXn.GCKgtND7GbXnSR/3FCKICaaS0hRDRPW';
    const isValidWithDb = await bcrypt.compare(plainPassword, dbHash);
    console.log('Comparison with DB hash:', isValidWithDb);

  } catch (error) {
    console.error('Error:', error);
  }
}

debugPassword();
