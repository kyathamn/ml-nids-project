import React from 'react';
import { X, BookOpen, CheckCircle, Shield, Award, Cpu } from 'lucide-react';

interface AbstractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AbstractModal: React.FC<AbstractModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="abstract-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="abstract-modal-card"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative"
      >
        <button
          id="close-abstract-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Abstract: Network Intrusion Detection Using Machine Learning
            </h2>
            <p className="text-xs text-slate-400">
              Supervised Learning Architecture & Experimental Benchmark Evaluation
            </p>
          </div>
        </div>

        {/* Paper Text */}
        <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 italic text-slate-300">
            "With the rapid growth of computer networks and internet-based services, cybersecurity threats have become increasingly sophisticated and frequent. Traditional intrusion detection systems (IDS) often rely on signature-based methods, which struggle to detect new and evolving attacks. Machine Learning (ML) offers an effective solution by enabling systems to learn patterns from network traffic and identify malicious activities automatically.
            <br /><br />
            This study presents a Machine Learning-based Network Intrusion Detection System designed to classify network traffic as normal or malicious. The proposed approach involves data preprocessing, feature selection, and the application of supervised learning algorithms such as Decision Trees, Random Forest, Support Vector Machines (SVM), and Neural Networks. Publicly available datasets are used for training and evaluating the models.
            <br /><br />
            Performance is measured using metrics including accuracy, precision, recall, F1-score, and detection rate. Experimental results demonstrate that ML-based models can effectively detect various types of network attacks while reducing false alarms compared to conventional methods. The study highlights the potential of machine learning techniques in enhancing network security through intelligent, adaptive, and real-time intrusion detection."
          </div>

          {/* Key Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Supervised Algorithms Evaluated:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong>Decision Trees (C4.5/CART)</strong>: Ultra-fast rule-based splitting (0.38 ms latency).</li>
                <li><strong>Random Forest</strong>: Top F1-Score (98.98%) and lowest False Alarm Rate (0.72%).</li>
                <li><strong>Support Vector Machines (SVM)</strong>: High dimensional separation using RBF Kernel.</li>
                <li><strong>Neural Networks (MLP)</strong>: 3-layer perceptron learning nonlinear pattern representations.</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attack Taxonomy Covered:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong>Normal Traffic</strong>: Standard RFC-compliant communication.</li>
                <li><strong>DoS (Denial of Service)</strong>: Neptune SYN Flood, Smurf, Teardrop.</li>
                <li><strong>Probe (Surveillance)</strong>: PortSweep, IPsweep, Nmap reconnaissance.</li>
                <li><strong>R2L (Remote to Local)</strong>: FTP/SSH Password Guessing, Imap exploit.</li>
                <li><strong>U2R (User to Root)</strong>: Buffer Overflows, Rootkit elevation exploits.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Abstract
          </button>
        </div>
      </div>
    </div>
  );
};
