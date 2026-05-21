"use client";

import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  // Tab handling state: 'profile' | 'security'
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    name: 'Mandy',
    email: 'mandychen@gmail.com',
    phone: '+1 (222) 155-0470'
  });

  const [passwordData, setPasswordData] = useState({
    createPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-6 font-sans antialiased text-[#1e293b]">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Top Tab Navigation Bar */}
        <div className="w-full bg-white border border-slate-200 rounded-xl p-1.5 flex items-center">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-[#0052cc] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-[#0052cc] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Security
          </button>
        </div>

        {/* User Hero Banner Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6 pb-8 flex flex-col items-center relative">
          {/* Blue Header Banner */}
          <div className="w-full h-44 bg-[#5c9ce6] rounded-xl mb-16 relative"></div>

          {/* Absolute Overlapping Avatar Profile */}
          <div className="absolute top-32 w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256" 
              alt="Jackson Doe"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Identity & Button */}
          <div className="text-center space-y-4 mt-2">
            <h1 className="text-3xl font-serif font-bold text-[#1a253c] tracking-wide flex items-center justify-center gap-1.5">
              Jackson Doe
              <CheckCircle2 className="w-5 h-5 text-[#0052cc] fill-[#0052cc] stroke-white stroke-[2.5]" />
            </h1>
            
            <button className="bg-[#0052cc] hover:bg-blue-700 text-white text-xs font-semibold px-12 py-3 rounded-lg shadow-sm transition-colors">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Dynamic Form Content Box */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
          {activeTab === 'profile' ? (
            /* ================= PROFILE TAB CONTENT ================= */
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#1a253c] tracking-tight">
                Personal Information
              </h3>
              
              <div className="space-y-4">
                {/* Full Name Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* Email and Phone Grid Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">Phone Number</label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= SECURITY TAB CONTENT ================= */
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#1a253c] tracking-tight">
                Password Settings
              </h3>
              
              <div className="space-y-4">
                {/* Create Password Row */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500">Create Password</label>
                  <input
                    type="password"
                    placeholder="********"
                    value={passwordData.createPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, createPassword: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* New & Confirm Password Input Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* New Password */}
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs font-bold text-slate-500">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="********"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs font-bold text-slate-500">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="********"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Bottom Control Buttons (Shared across tabs) */}
          <div className="flex justify-end gap-4 pt-8 mt-4 border-t border-slate-50">
            <button className="px-6 py-3 bg-white border border-red-200 hover:bg-red-50 text-red-500 font-medium text-xs rounded-lg transition-colors">
              Discard Changes
            </button>
            <button className="px-6 py-3 bg-[#0052cc] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors">
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}