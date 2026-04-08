import React from "react";
import { X, CheckCircle } from "lucide-react";

const UpgradeModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative">

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Upgrade to Premium
        </h2>
        <p className="text-center text-gray-500 mt-2 px-6">
          You have used your free plan limit. Upgrade to Premium to convert
          unlimited OST files and upload files up to 5 GB.
        </p>

        {/* Free Plan */}
        <div className="mt-6 border rounded-xl p-4 bg-gray-50 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Free</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                CURRENT
              </span>
            </div>
            <p className="text-sm text-gray-500">Basic conversion</p>
          </div>

          <div className="flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CheckCircle size={16} className="text-gray-400" />
              Convert 1 OST file
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle size={16} className="text-gray-400" />
              File size up to 500MB
            </div>
          </div>
        </div>

        {/* Premium Plan */}
        <div className="mt-4 border-2 border-blue-600 rounded-xl p-5 flex justify-between items-center">

          {/* Left */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Premium</h3>
              <span className="text-blue-600">⭐</span>
            </div>

            <p className="text-3xl font-bold mt-1">
              $29.99 <span className="text-sm font-normal text-gray-500">/mailbox</span>
            </p>

            <div className="mt-3 space-y-2 text-gray-700 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" />
                Unlimited OST files
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" />
                Upload size up to 5 GB
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" />
                Priority processing
              </div>
            </div>
          </div>

          {/* Button */}
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Upgrade Now →
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-center gap-8 text-sm text-gray-500">
          <span>🔒 Secure Checkout</span>
          <span>🎧 Expert Support</span>
          <span>💯 100% Satisfaction</span>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;