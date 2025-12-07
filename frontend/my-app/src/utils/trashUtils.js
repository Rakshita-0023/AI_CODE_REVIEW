// Utility functions for trash management
export const moveToTrash = (item, type) => {
  const trashedItem = {
    ...item,
    type,
    deletedAt: new Date().toISOString(),
    originalId: item.id
  };
  
  const existingTrash = JSON.parse(localStorage.getItem('trashedItems') || '[]');
  const updatedTrash = [trashedItem, ...existingTrash];
  localStorage.setItem('trashedItems', JSON.stringify(updatedTrash));
  
  return trashedItem;
};

export const restoreFromTrash = (itemId) => {
  const trash = JSON.parse(localStorage.getItem('trashedItems') || '[]');
  const item = trash.find(item => item.id === itemId);
  const updatedTrash = trash.filter(item => item.id !== itemId);
  localStorage.setItem('trashedItems', JSON.stringify(updatedTrash));
  
  return item;
};

export const permanentlyDeleteFromTrash = (itemId) => {
  const trash = JSON.parse(localStorage.getItem('trashedItems') || '[]');
  const updatedTrash = trash.filter(item => item.id !== itemId);
  localStorage.setItem('trashedItems', JSON.stringify(updatedTrash));
};