import Settings from '../models/Settings.js';

// Get all settings
export const getAllSettings = async () => {
  try {
    const settings = await Settings.find().sort({ category: 1, key: 1 });
    return settings;
  } catch (error) {
    throw new Error('Failed to fetch settings');
  }
};

// Get settings by category
export const getSettingsByCategory = async (category) => {
  try {
    const settings = await Settings.find({ category }).sort({ key: 1 });
    return settings;
  } catch (error) {
    throw new Error('Failed to fetch settings by category');
  }
};

// Get setting by key
export const getSettingByKey = async (key) => {
  try {
    const setting = await Settings.findOne({ key });
    return setting;
  } catch (error) {
    throw new Error('Failed to fetch setting');
  }
};

// Create new setting
export const createSetting = async (settingData) => {
  try {
    const { key, value, description, category } = settingData;

    // Check if key already exists
    const existingSetting = await Settings.findOne({ key });
    if (existingSetting) {
      throw new Error('Setting with this key already exists');
    }

    const newSetting = new Settings({
      key,
      value,
      description,
      category
    });

    await newSetting.save();
    return newSetting;
  } catch (error) {
    throw error;
  }
};

// Update setting
export const updateSetting = async (id, updateData) => {
  try {
    const { key, value, description, category } = updateData;

    // If key is being updated, check for uniqueness
    if (key) {
      const existingSetting = await Settings.findOne({ key, _id: { $ne: id } });
      if (existingSetting) {
        throw new Error('Setting with this key already exists');
      }
    }

    const updatedSetting = await Settings.findByIdAndUpdate(
      id,
      { key, value, description, category },
      { new: true, runValidators: true }
    );

    if (!updatedSetting) {
      throw new Error('Setting not found');
    }

    return updatedSetting;
  } catch (error) {
    throw error;
  }
};

// Delete setting
export const deleteSetting = async (id) => {
  try {
    const deletedSetting = await Settings.findByIdAndDelete(id);

    if (!deletedSetting) {
      throw new Error('Setting not found');
    }

    return deletedSetting;
  } catch (error) {
    throw error;
  }
};

// Get setting value by key (helper function)
export const getSettingValue = async (key, defaultValue = null) => {
  try {
    const setting = await Settings.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error('Error fetching setting value:', error);
    return defaultValue;
  }
};
