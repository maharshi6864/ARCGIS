import React, { useState } from 'react';

export function ManageVehiclesView({
  vehicles = [],
  vehicleModels = [],
  dets = [],
  onSaveVehicle,
  onDeleteVehicle,
  onSaveVehicleModel,
  onDeleteVehicleModel,
}) {
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'models'
  const [filterDetId, setFilterDetId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_model_id: '',
    det_id: '',
    vehicle_type: 'Armored Patrol',
    status: 'Serviceable',
    critical_limit: 5.0,
  });

  // Vehicle Model Modal State
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [modelForm, setModelForm] = useState({
    name: '',
    critical_margin: 10.0,
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Filtered Vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchDet = filterDetId === 'all' || v.det_id === parseInt(filterDetId);
    const matchStatus = filterStatus === 'all' || v.status.toLowerCase() === filterStatus.toLowerCase();
    const modelName = v.model?.name || '';
    const detName = v.det?.name || '';
    const matchSearch =
      modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vehicle_type && v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchDet && matchStatus && matchSearch;
  });

  // Filtered Models
  const filteredModels = vehicleModels.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open Add/Edit Vehicle
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      vehicle_model_id: vehicleModels[0]?.id || '',
      det_id: dets[0]?.id || '',
      vehicle_type: 'Armored Patrol',
      status: 'Serviceable',
      critical_limit: 5.0,
    });
    setErrors({});
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh) => {
    setEditingVehicle(veh);
    setVehicleForm({
      vehicle_model_id: veh.vehicle_model_id,
      det_id: veh.det_id,
      vehicle_type: veh.vehicle_type || 'Standard',
      status: veh.status || 'Serviceable',
      critical_limit: veh.critical_limit ?? 0,
    });
    setErrors({});
    setIsVehicleModalOpen(true);
  };

  const handleSubmitVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.vehicle_model_id) {
      setErrors({ form: 'Please select a vehicle model.' });
      return;
    }
    if (!vehicleForm.det_id) {
      setErrors({ form: 'Please select a det.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaveVehicle({
        id: editingVehicle?.id,
        vehicle_model_id: parseInt(vehicleForm.vehicle_model_id),
        det_id: parseInt(vehicleForm.det_id),
        vehicle_type: vehicleForm.vehicle_type.trim(),
        status: vehicleForm.status,
        critical_limit: parseFloat(vehicleForm.critical_limit) || 0,
      });
      setIsVehicleModalOpen(false);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Add/Edit Model
  const handleOpenAddModel = () => {
    setEditingModel(null);
    setModelForm({ name: '', critical_margin: 10.0 });
    setErrors({});
    setIsModelModalOpen(true);
  };

  const handleOpenEditModel = (model) => {
    setEditingModel(model);
    setModelForm({
      name: model.name,
      critical_margin: model.critical_margin ?? 0,
    });
    setErrors({});
    setIsModelModalOpen(true);
  };

  const handleSubmitModel = async (e) => {
    e.preventDefault();
    if (!modelForm.name.trim()) {
      setErrors({ form: 'Model name is required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaveVehicleModel({
        id: editingModel?.id,
        name: modelForm.name.trim(),
        critical_margin: parseFloat(modelForm.critical_margin) || 0,
      });
      setIsModelModalOpen(false);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'serviceable':
      case 'operational':
        return 'bg-success-subtle text-success';
      case 'unserviceable':
      case 'critical':
      case 'maintenance':
        return 'bg-danger-subtle text-danger';
      default:
        return 'bg-secondary text-light';
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h5 fw-bold text-light m-0">Combat & Tactical Vehicles</h2>
          <small className="text-secondary">Fleet deployments, critical thresholds, and vehicle model specifications</small>
        </div>

        {/* Action Button */}
        <div className="d-flex align-items-center gap-2">
          {activeTab === 'fleet' ? (
            <button
              type="button"
              className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
              onClick={handleOpenAddVehicle}
            >
              <span className="material-symbols-outlined md-18">add</span>
              <span>Deploy Vehicle</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
              onClick={handleOpenAddModel}
            >
              <span className="material-symbols-outlined md-18">add</span>
              <span>New Vehicle Model</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter Controls */}
      <div className="card shadow-sm mb-4 border-secondary">
        <div className="card-header px-3 py-2 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
          {/* Sub-Tabs */}
          <ul className="nav nav-pills gap-1">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1 px-3 rounded small d-flex align-items-center gap-2 ${
                  activeTab === 'fleet' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('fleet')}
              >
                <span className="material-symbols-outlined md-18">local_shipping</span>
                <span>Vehicle Fleet ({vehicles.length})</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1 px-3 rounded small d-flex align-items-center gap-2 ${
                  activeTab === 'models' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('models')}
              >
                <span className="material-symbols-outlined md-18">precision_manufacturing</span>
                <span>Vehicle Models ({vehicleModels.length})</span>
              </button>
            </li>
          </ul>

          {/* Filter Bar */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {activeTab === 'fleet' && (
              <>
                {/* Det Filter */}
                <select
                  className="form-select form-select-sm"
                  style={{ width: '160px' }}
                  value={filterDetId}
                  onChange={(e) => setFilterDetId(e.target.value)}
                >
                  <option value="all">All Dets</option>
                  {dets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  className="form-select form-select-sm"
                  style={{ width: '140px' }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="serviceable">Serviceable</option>
                  <option value="unserviceable">Unserviceable</option>
                </select>
              </>
            )}

            {/* Search */}
            <div className="input-group input-group-sm m-0" style={{ width: '180px' }}>
              <span className="input-group-text bg-dark text-secondary border-secondary">
                <span className="material-symbols-outlined md-16">search</span>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Vehicle Fleet Table */}
        {activeTab === 'fleet' && (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Model Specification</th>
                  <th>Classification</th>
                  <th>Assigned Station</th>
                  <th>Critical Limit</th>
                  <th>Readiness Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-secondary">
                      <span className="material-symbols-outlined md-32 opacity-50 mb-1">local_shipping</span>
                      <p className="m-0 text-light fw-semibold">No Vehicles Deployed</p>
                      <small>Click "Deploy Vehicle" to register combat transport assets.</small>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="font-monospace text-secondary fw-bold" style={{ width: '90px' }}>
                        VEH #{v.id}
                      </td>
                      <td>
                        <div className="fw-bold text-light d-flex align-items-center gap-1">
                          <span className="material-symbols-outlined md-16 text-success">directions_car</span>
                          <span>{v.model?.name || `Model #${v.vehicle_model_id}`}</span>
                        </div>
                      </td>
                      <td className="small text-secondary">{v.vehicle_type || 'Standard'}</td>
                      <td>
                        <span className="badge bg-secondary text-light">
                          {v.det?.name || `DET #${v.det_id}`}
                        </span>
                      </td>
                      <td className="font-monospace text-warning small">
                        {v.critical_limit ?? 0}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="text-end">
                        {deleteConfirmId === `v-${v.id}` ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm py-0 px-2 fw-bold"
                              style={{ fontSize: '11px' }}
                              onClick={() => {
                                onDeleteVehicle(v.id);
                                setDeleteConfirmId(null);
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm py-0 px-2"
                              style={{ fontSize: '11px' }}
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm p-1 text-secondary"
                              title="Edit vehicle"
                              onClick={() => handleOpenEditVehicle(v)}
                            >
                              <span className="material-symbols-outlined md-16">edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm p-1 text-danger"
                              title="Delete vehicle"
                              onClick={() => setDeleteConfirmId(`v-${v.id}`)}
                            >
                              <span className="material-symbols-outlined md-16">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Vehicle Models Table */}
        {activeTab === 'models' && (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Model Name</th>
                  <th>Critical Margin Threshold</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-secondary">
                      <span className="material-symbols-outlined md-32 opacity-50 mb-1">precision_manufacturing</span>
                      <p className="m-0 text-light fw-semibold">No Vehicle Models Defined</p>
                      <small>Click "New Vehicle Model" to add hardware templates.</small>
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((m) => (
                    <tr key={m.id}>
                      <td className="font-monospace text-secondary fw-bold" style={{ width: '90px' }}>
                        MDL #{m.id}
                      </td>
                      <td>
                        <div className="fw-bold text-light d-flex align-items-center gap-1">
                          <span className="material-symbols-outlined md-16 text-warning">local_shipping</span>
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td className="font-monospace text-warning small">
                        {m.critical_margin ?? 0}
                      </td>
                      <td className="text-end">
                        {deleteConfirmId === `m-${m.id}` ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm py-0 px-2 fw-bold"
                              style={{ fontSize: '11px' }}
                              onClick={() => {
                                onDeleteVehicleModel(m.id);
                                setDeleteConfirmId(null);
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm py-0 px-2"
                              style={{ fontSize: '11px' }}
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm p-1 text-secondary"
                              title="Edit model"
                              onClick={() => handleOpenEditModel(m)}
                            >
                              <span className="material-symbols-outlined md-16">edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm p-1 text-danger"
                              title="Delete model"
                              onClick={() => setDeleteConfirmId(`m-${m.id}`)}
                            >
                              <span className="material-symbols-outlined md-16">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Deploy / Edit Vehicle */}
      {isVehicleModalOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }} role="dialog">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-secondary">
                <div className="modal-header p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined md-20 text-success">
                      {editingVehicle ? 'edit' : 'add_circle'}
                    </span>
                    <h5 className="modal-title fw-bold m-0 text-light" style={{ fontSize: '16px' }}>
                      {editingVehicle ? 'Edit Tactical Vehicle' : 'Deploy Tactical Vehicle'}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary p-1"
                    onClick={() => setIsVehicleModalOpen(false)}
                  >
                    <span className="material-symbols-outlined md-18">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmitVehicle}>
                  <div className="modal-body p-4">
                    {errors.form && (
                      <div className="alert alert-danger py-2 px-3 small mb-3">{errors.form}</div>
                    )}

                    <div className="row g-3">
                      {/* Vehicle Model Dropdown */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">
                          Vehicle Model <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={vehicleForm.vehicle_model_id}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_model_id: e.target.value })}
                        >
                          <option value="">Select a Vehicle Model</option>
                          {vehicleModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Margin: {m.critical_margin})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Station Dets Dropdown */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">
                          Assigned Station (Det) <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={vehicleForm.det_id}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, det_id: e.target.value })}
                        >
                          <option value="">Select a Station</option>
                          {dets.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.latitude.toFixed(2)}°, {d.longitude.toFixed(2)}°)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Vehicle Type */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Vehicle Classification</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Armored Patrol"
                          value={vehicleForm.vehicle_type}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                        />
                      </div>

                      {/* Status */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Readiness Status</label>
                        <select
                          className="form-select"
                          value={vehicleForm.status}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                        >
                          <option value="Serviceable">Serviceable</option>
                          <option value="Unserviceable">Unserviceable</option>
                        </select>
                      </div>

                      {/* Critical Limit */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">Critical Limit Value</label>
                        <input
                          type="number"
                          step="any"
                          className="form-control font-monospace"
                          value={vehicleForm.critical_limit}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, critical_limit: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer p-3 border-top border-secondary">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-3"
                      onClick={() => setIsVehicleModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-success btn-sm px-4 d-flex align-items-center gap-1"
                    >
                      <span className="material-symbols-outlined md-16">check</span>
                      <span>{isSubmitting ? 'Saving...' : (editingVehicle ? 'Save Changes' : 'Deploy Vehicle')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal: Add / Edit Vehicle Model */}
      {isModelModalOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }} role="dialog">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-secondary">
                <div className="modal-header p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined md-20 text-success">
                      {editingModel ? 'edit' : 'add'}
                    </span>
                    <h5 className="modal-title fw-bold m-0 text-light" style={{ fontSize: '16px' }}>
                      {editingModel ? 'Edit Vehicle Model' : 'New Vehicle Model'}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary p-1"
                    onClick={() => setIsModelModalOpen(false)}
                  >
                    <span className="material-symbols-outlined md-18">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmitModel}>
                  <div className="modal-body p-4">
                    {errors.form && (
                      <div className="alert alert-danger py-2 px-3 small mb-3">{errors.form}</div>
                    )}

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">
                          Model Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Oshkosh JLTV / Humvee M1151"
                          value={modelForm.name}
                          onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">
                          Critical Margin Threshold
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="form-control font-monospace"
                          value={modelForm.critical_margin}
                          onChange={(e) => setModelForm({ ...modelForm, critical_margin: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer p-3 border-top border-secondary">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-3"
                      onClick={() => setIsModelModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-success btn-sm px-4 d-flex align-items-center gap-1"
                    >
                      <span className="material-symbols-outlined md-16">check</span>
                      <span>{isSubmitting ? 'Saving...' : (editingModel ? 'Save Changes' : 'Create Model')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
