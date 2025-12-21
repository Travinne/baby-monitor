import { post, get, put, del } from './client';

export const getAllergies = async () => {
  try {
    const response = await get('allergies');
    return response.allergies || response.data || [];
  } catch (error) {
    console.error('Get allergies error:', error);
    return [];
  }
};

export const getOneAllergy = async (id) => {
  try {
    const response = await get(`allergies/${id}`);
    return {
      success: true,
      data: response.allergy || response.data
    };
  } catch (error) {
    console.error('Get allergy error:', error);
    return {
      success: false,
      message: error.data?.message || 'Failed to fetch allergy'
    };
  }
};

export const addAllergy = async (allergyData) => {
  try {
    const response = await post('allergies', allergyData);
    return {
      success: true,
      data: response.allergy || response.data
    };
  } catch (error) {
    console.error('Add allergy error:', error);
    return {
      success: false,
      message: error.data?.message || 'Failed to add allergy'
    };
  }
};

export const updateAllergy = async (id, allergyData) => {
  try {
    const response = await put(`allergies/${id}`, allergyData);
    return {
      success: true,
      data: response.allergy || response.data
    };
  } catch (error) {
    console.error('Update allergy error:', error);
    return {
      success: false,
      message: error.data?.message || 'Failed to update allergy'
    };
  }
};

export const deleteAllergy = async (id) => {
  try {
    await del(`allergies/${id}`);
    return {
      success: true,
      message: 'Allergy deleted successfully'
    };
  } catch (error) {
    console.error('Delete allergy error:', error);
    return {
      success: false,
      message: error.data?.message || 'Failed to delete allergy'
    };
  }
};