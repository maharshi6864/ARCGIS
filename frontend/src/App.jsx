import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardView } from './views/DashboardView';
import { ManageDetsView } from './views/ManageDetsView';
import { ManageVehiclesView } from './views/ManageVehiclesView';
import { ManageRecoveryView } from './views/ManageRecoveryView';
import { SettingsView } from './views/SettingsView';
import { api } from './services/api';

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Core Data State
  const [stats, setStats] = useState(null);
  const [dets, setDets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [recoveries, setRecoveries] = useState([]);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Synchronize all data from backend
  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [
        statsData,
        detsData,
        vehiclesData,
        vModelsData,
        recoveriesData,
      ] = await Promise.all([
        api.getStats().catch(() => null),
        api.getDets().catch(() => []),
        api.getVehicles().catch(() => []),
        api.getVehicleModels().catch(() => []),
        api.getRecoveries().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setDets(detsData);
      setVehicles(vehiclesData);
      setVehicleModels(vModelsData);
      setRecoveries(recoveriesData);
    } catch (err) {
      console.error('Failed to sync backend:', err);
      showToast('Offline sync active: Failed to reach server', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Detachment CRUD Handlers
  const handleSaveDet = async (detData) => {
    try {
      if (detData.id) {
        await api.updateDet(detData.id, detData);
        showToast(`Detachment "${detData.name}" updated successfully.`);
      } else {
        await api.createDet(detData);
        showToast(`Detachment "${detData.name}" deployed.`);
      }
      await loadAllData();
    } catch (err) {
      console.error('Save det error:', err);
      showToast(err.message || 'Error saving detachment', 'error');
      throw err;
    }
  };

  const handleDeleteDet = async (id) => {
    try {
      await api.deleteDet(id);
      showToast(`Detachment #${id} decommissioned.`);
      await loadAllData();
    } catch (err) {
      console.error('Delete det error:', err);
      showToast(err.message || 'Error deleting detachment', 'error');
    }
  };

  // Vehicle CRUD Handlers
  const handleSaveVehicle = async (vehData) => {
    try {
      if (vehData.id) {
        await api.updateVehicle(vehData.id, vehData);
        showToast(`Vehicle #${vehData.id} updated.`);
      } else {
        await api.createVehicle(vehData);
        showToast('Tactical vehicle deployed to fleet.');
      }
      await loadAllData();
    } catch (err) {
      console.error('Save vehicle error:', err);
      showToast(err.message || 'Error saving vehicle', 'error');
      throw err;
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await api.deleteVehicle(id);
      showToast(`Vehicle #${id} decommissioned.`);
      await loadAllData();
    } catch (err) {
      console.error('Delete vehicle error:', err);
      showToast(err.message || 'Error deleting vehicle', 'error');
    }
  };

  const handleSaveVehicleModel = async (modelData) => {
    try {
      if (modelData.id) {
        await api.updateVehicleModel(modelData.id, modelData);
        showToast(`Vehicle model "${modelData.name}" updated.`);
      } else {
        await api.createVehicleModel(modelData);
        showToast(`Vehicle model "${modelData.name}" registered.`);
      }
      await loadAllData();
    } catch (err) {
      console.error('Save vehicle model error:', err);
      showToast(err.message || 'Error saving vehicle model', 'error');
      throw err;
    }
  };

  const handleDeleteVehicleModel = async (id) => {
    try {
      await api.deleteVehicleModel(id);
      showToast(`Vehicle model #${id} removed.`);
      await loadAllData();
    } catch (err) {
      console.error('Delete vehicle model error:', err);
      showToast(err.message || 'Error deleting vehicle model', 'error');
    }
  };

  // Recovery Activity CRUD Handlers
  const handleSaveRecovery = async (recoveryData) => {
    try {
      if (recoveryData.id) {
        await api.updateRecovery(recoveryData.id, recoveryData);
        showToast(`Recovery mission #${recoveryData.id} updated.`);
      } else {
        await api.createRecovery(recoveryData);
        showToast('Recovery activity logged successfully.');
      }
      await loadAllData();
    } catch (err) {
      console.error('Save recovery error:', err);
      showToast(err.message || 'Error saving recovery activity', 'error');
      throw err;
    }
  };

  const handleDeleteRecovery = async (id) => {
    try {
      await api.deleteRecovery(id);
      showToast(`Recovery mission #${id} removed.`);
      await loadAllData();
    } catch (err) {
      console.error('Delete recovery error:', err);
      showToast(err.message || 'Error deleting recovery activity', 'error');
    }
  };

  return (
    <div className="d-flex w-100 vh-100 overflow-hidden bg-dark">
      {/* Tactical Left Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        stats={stats}
      />

      {/* Main Content Area */}
      <div
        className="d-flex flex-column flex-grow-1 overflow-hidden"
        style={{
          marginLeft: sidebarCollapsed ? '72px' : '260px',
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Top Header Navbar */}
        <TopNavbar
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Scrollable View Container with React Router Routes */}
        <main
          className="flex-grow-1 overflow-auto bg-dark"
          style={{
            marginTop: '64px',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <DashboardView
                  stats={stats}
                  dets={dets}
                  vehicles={vehicles}
                  recoveries={recoveries}
                  onRefresh={loadAllData}
                />
              }
            />
            <Route
              path="/dets"
              element={
                <ManageDetsView
                  dets={dets}
                  onSaveDet={handleSaveDet}
                  onDeleteDet={handleDeleteDet}
                />
              }
            />
            <Route
              path="/vehicles"
              element={
                <ManageVehiclesView
                  vehicles={vehicles}
                  vehicleModels={vehicleModels}
                  dets={dets}
                  onSaveVehicle={handleSaveVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onSaveVehicleModel={handleSaveVehicleModel}
                  onDeleteVehicleModel={handleDeleteVehicleModel}
                />
              }
            />
            <Route
              path="/recovery"
              element={
                <ManageRecoveryView
                  recoveries={recoveries}
                  dets={dets}
                  vehicles={vehicles}
                  onSaveRecovery={handleSaveRecovery}
                  onDeleteRecovery={handleDeleteRecovery}
                />
              }
            />
            <Route
              path="/settings"
              element={<SettingsView onRefreshAll={loadAllData} />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Tactical Toast Alert (Native Bootstrap 5) */}
      {toast && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 1100, marginTop: '64px' }}
        >
          <div
            className={`card shadow-lg border p-3 d-flex flex-row align-items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-danger text-white border-danger'
                : 'bg-body-secondary text-light border-secondary'
            }`}
            style={{ minWidth: '280px' }}
          >
            <span
              className={`material-symbols-outlined md-20 ${
                toast.type === 'error' ? 'text-white' : 'text-warning'
              }`}
            >
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span className="small fw-semibold flex-grow-1">{toast.message}</span>
            <button
              type="button"
              className="btn btn-sm p-0 text-secondary"
              onClick={() => setToast(null)}
            >
              <span className="material-symbols-outlined md-16">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
