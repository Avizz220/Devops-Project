import Swal from 'sweetalert2';

const baseStyle = {
  customClass: {
    confirmButton: 'swal-confirm-button',
    cancelButton: 'swal-cancel-button',
    title: 'swal-title',
    popup: 'swal-popup'
  },
  buttonsStyling: true
};

export const showSuccessAlert = ({
  title = 'Success',
  text,
  timer = 0,
  confirmButtonText = 'OK',
  callback = null
}) => {
  const options = {
    ...baseStyle,
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#3085d6',
    confirmButtonText
  };

  if (timer > 0) {
    options.timer = timer;
    options.timerProgressBar = true;
    options.showConfirmButton = false;
  }

  return Swal.fire(options).then(result => {
    if (callback && typeof callback === 'function') {
      callback(result);
    }
    return result;
  });
};

export const showErrorAlert = ({
  title = 'Error',
  text,
  confirmButtonText = 'OK'
}) => {
  return Swal.fire({
    ...baseStyle,
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#d33',
    confirmButtonText
  });
};

export const showConfirmAlert = ({
  title = 'Are you sure?',
  text,
  confirmButtonText = 'Yes',
  cancelButtonText = 'Cancel',
  showCancelButton = true
}) => {
  return Swal.fire({
    ...baseStyle,
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText,
    cancelButtonText,
    showCancelButton
  });
};

export const initSweetAlertStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .swal-popup {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 10px;
    }
    
    .swal-title {
      color: #2c3e50;
      font-size: 1.8rem;
    }
    
    .swal-confirm-button {
      font-weight: 500;
      letter-spacing: 0.5px;
      padding: 12px 24px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    
    .swal-confirm-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .swal-cancel-button {
      font-weight: 500;
      letter-spacing: 0.5px;
      padding: 12px 24px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    
    .swal-cancel-button:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
};

export default {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
  initSweetAlertStyles
};
