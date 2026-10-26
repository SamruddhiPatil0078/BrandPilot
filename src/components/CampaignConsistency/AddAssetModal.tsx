import React, { useState } from 'react';
import { Plus, Upload, Layers } from 'lucide-react';
import { AssetChannel, CampaignAsset } from '../../types/campaign';

interface AddAssetModalProps {
  onClose: () => void;
  onAddAsset: (newAsset: CampaignAsset) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ onClose, onAddAsset }) => {
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<AssetChannel>('Billboard');
  const [format, setFormat] = useState<'Image' | 'PDF' | 'Copy'>('Image');
  const [priceStr, setPriceStr] = useState('₹1,299');
  const [offer, setOffer] = useState('Standard Price');
  const [dateStr, setDateStr] = useState('Valid till 30 Nov 2026');
  const [tagline, setTagline] = useState('Discover your daily skincare ritual.');
  const [logoVersion, setLogoVersion] = useState('Logo v3 (Approved)');
  const [disclaimer, setDisclaimer] = useState('*Based on clinical trial of 30 women over 4 weeks.');
  const [fullText, setFullText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 1299;

    const newAsset: CampaignAsset = {
      id: `asset-${Date.now()}`,
      title: title.trim(),
      channel,
      format,
      previewUrl: 'campaign-asset-custom',
      uploadedAt: new Date().toISOString(),
      extractedPrice: priceNum,
      extractedPriceStr: priceStr,
      extractedOffer: offer,
      extractedDate: dateStr,
      extractedTagline: tagline,
      extractedLogoVersion: logoVersion,
      extractedDisclaimer: disclaimer,
      fullText: fullText || `${title} - ${tagline}. Price: ${priceStr}. ${disclaimer}`,
      status: 'In Sync',
      conflictCount: 0
    };

    onAddAsset(newAsset);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
              <Layers size={18} color="#2563EB" />
              <span>Add Creative Asset to Campaign</span>
            </div>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Asset Title</label>
              <input
                className="form-input"
                placeholder="e.g. Metro Station Outdoor Billboard"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Marketing Channel</label>
                <select
                  className="form-select"
                  value={channel}
                  onChange={e => setChannel(e.target.value as AssetChannel)}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Website">Website</option>
                  <option value="Print Brochure">Print Brochure</option>
                  <option value="Email">Email</option>
                  <option value="Billboard">Billboard</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Asset Format</label>
                <select
                  className="form-select"
                  value={format}
                  onChange={e => setFormat(e.target.value as any)}
                >
                  <option value="Image">Image (Social / Banner)</option>
                  <option value="PDF">PDF (Brochure / Catalog)</option>
                  <option value="Copy">Copy (Landing page / Email)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Displayed Price</label>
                <input
                  className="form-input"
                  placeholder="e.g. ₹1,299"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Displayed Logo Version</label>
                <select
                  className="form-select"
                  value={logoVersion}
                  onChange={e => setLogoVersion(e.target.value)}
                >
                  <option value="Logo v3 (Approved)">Logo v3.0 (Botanical Emblem - Approved)</option>
                  <option value="Logo v2 (Deprecated)">Logo v2.1 (Vintage Crest - Deprecated)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tagline / Headline</label>
              <input
                className="form-input"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Discover your daily skincare ritual."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mandatory Disclaimer Included?</label>
              <input
                className="form-input"
                value={disclaimer}
                onChange={e => setDisclaimer(e.target.value)}
                placeholder="e.g. *Based on clinical trial of 30 women over 4 weeks or 'None'"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Draft Copy / Full Text</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={fullText}
                onChange={e => setFullText(e.target.value)}
                placeholder="Draft copy of the asset..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-brand">
              <Plus size={14} />
              <span>Add to Campaign & Run Audit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
