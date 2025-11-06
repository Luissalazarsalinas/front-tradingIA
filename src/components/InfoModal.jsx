// src/components/InfoModal.jsx
import React from 'react';
import PropTypes from 'prop-types';

const InfoModal = ({ show = false, title = '', children = null, onClose = () => {} }) => {
  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content custom-modal">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
            </div>

            <div className="modal-body">
              {children}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>

      {/* backdrop */}
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
};

InfoModal.propTypes = {
  show: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func
};

export default InfoModal;

