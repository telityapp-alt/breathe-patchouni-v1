import React, { useState } from 'react';
import { ShoppingCart, ShoppingBag, ArrowLeft, Star, ShieldCheck, Wind, CheckCircle2, ChevronRight, Settings2, Shield, HeartPulse, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../store/AppContext';

const PRODUCTS = [
  {
    id: "device-starter",
    name: "Breathe AI Smart Inhaler by Patchouni - Starter Kit",
    price: 120000,
    description: "The complete setup. A smart connected device that tracks your usage, plus 3 curated pods for cravings.",
    educational: "Nicotine Replacement Therapy (NRT) is effective, but often lacks the behavioral component. Breathe AI by Patchouni pairs physical sensation with cognitive tracking.",
    features: ["Bluetooth Sync", "Haptic Feedback", "Includes 3 Pods (Cool Mint, Warm Bitter, Spicy Herbal)"],
    type: "device",
    color: "bg-brand",
    image: <Wind className="w-16 h-16 text-white" />
  },
  {
    id: "pod-mint",
    name: "Cool-Mint Flavor Pod (3-Pack)",
    price: 45000,
    description: "Best for stress and fatigue. Gives a sharp, cold hit that overrides the amygdala's panic response.",
    educational: "Cold sensations simulate deep breathing and reset the vagus nerve, instantly lowering heart rate during a craving.",
    features: ["Zero Nicotine", "Medical Grade Silicone", "Lasts ~300 puffs"],
    type: "pod",
    color: "bg-blue-500",
    image: <Wind className="w-12 h-12 text-white" />
  },
  {
    id: "pod-warm",
    name: "Warm-Bitter Flavor Pod (3-Pack)",
    price: 45000,
    description: "Perfect replacement for the post-meal craving. Simulates the harshness of a real cigarette without the toxins.",
    educational: "Bitter taste receptors in the throat suppress the urge to inhale deeply, satisfying the 'throat hit' craving commonly missed by quitters.",
    features: ["Zero Nicotine", "Throat Hit Focus", "Lasts ~300 puffs"],
    type: "pod",
    color: "bg-amber-500",
    image: <Settings2 className="w-12 h-12 text-white" />
  },
  {
    id: "pod-spicy",
    name: "Spicy-Herbal Flavor Pod (3-Pack)",
    price: 45000,
    description: "Ideal for focus and breaks. A stimulating blend that wakes up the senses.",
    educational: "Spicy sensations release endorphins (the body's natural painkillers), providing a healthier neuro-reward than dopamine from nicotine.",
    features: ["Zero Nicotine", "Endorphin Trigger", "Lasts ~300 puffs"],
    type: "pod",
    color: "bg-rose-500",
    image: <HeartPulse className="w-12 h-12 text-white" />
  }
];

export function ShopPage({ setActiveTab }: { setActiveTab: (t: any) => void }) {
  const [cart, setCart] = useState<{id: string, qty: number}[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'cart'>('list');
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const formatIDR = (val: number) => {
     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const addToCart = (id: string) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === id);
      if (exists) {
        return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = PRODUCTS.find(p => p.id === item.id);
      return total + (product?.price || 0) * item.qty;
    }, 0);
  };

  if (view === 'cart') {
    return (
      <div className="flex flex-col h-full bg-gray-50 pt-8 px-5 pb-24 overflow-y-auto w-full">
        <header className="mb-6 flex gap-3 items-center">
          <button onClick={() => setView('list')} className="w-10 h-10 bg-white rounded-xl border-2 border-gray-200 shadow-[0_4px_0_#E5E7EB] flex items-center justify-center text-gray-500 active:translate-y-1 active:shadow-none transition-all">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Your Cart</h1>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-sm">Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cart.map(item => {
                const product = PRODUCTS.find(p => p.id === item.id);
                if (!product) return null;
                return (
                  <div key={item.id} className="card-duo flex gap-4 items-center p-3">
                    <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border-2 border-white shadow-[0_2px_0_#e5e7eb]", product.color)}>
                       {product.image}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</h3>
                      <p className="text-brand font-bold text-sm">{formatIDR(product.price)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-100 rounded-xl px-2 py-1">
                         <button onClick={() => updateQty(item.id, -1)} className="text-gray-500 font-bold w-6 h-6 flex items-center justify-center active:scale-95">-</button>
                         <span className="font-bold text-gray-900 text-sm">{item.qty}</span>
                         <button onClick={() => updateQty(item.id, 1)} className="text-brand font-bold w-6 h-6 flex items-center justify-center active:scale-95">+</button>
                       </div>
                       <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="card-duo mb-6 flex justify-between items-center bg-gray-900 text-white border-gray-800 shadow-[0_4px_0_#1f2937]">
               <span className="font-bold text-sm">Total</span>
               <span className="text-xl font-bold">{formatIDR(getCartTotal())}</span>
            </div>

            <p className="text-center text-xs font-bold text-gray-500 mb-4 px-4 leading-relaxed">
              * Breathe AI is currently exclusively available for user shipping and fulfillment in Indonesia.
            </p>

            <div className="flex flex-col gap-3">
              <a href="#" onClick={(e) => { e.preventDefault(); setShowPopup(true); }} className="bg-[#ee4d2d] text-white flex items-center gap-2 justify-center py-4 rounded-[1.25rem] font-bold text-[15px] active:scale-[0.98] transition-transform shadow-[0_4px_0_#d73e21]">
                Buy on Shopee
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowPopup(true); }} className="bg-[#00AA5B] text-white flex items-center gap-2 justify-center py-4 rounded-[1.25rem] font-bold text-[15px] active:scale-[0.98] transition-transform shadow-[0_4px_0_#008b4b]">
                Buy on Tokopedia
              </a>
            </div>
          </>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedProduct) {
    return (
      <div className="flex flex-col h-full bg-gray-50 pt-8 px-5 pb-24 overflow-y-auto w-full">
        <header className="mb-6 flex gap-3 items-center justify-between">
          <button onClick={() => setView('list')} className="w-10 h-10 bg-white rounded-xl border-2 border-gray-200 shadow-[0_4px_0_#E5E7EB] flex items-center justify-center text-gray-500 active:translate-y-1 active:shadow-none transition-all">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setView('cart')} className="relative w-10 h-10 bg-white rounded-xl border-2 border-gray-200 shadow-[0_4px_0_#E5E7EB] flex items-center justify-center text-gray-500 active:translate-y-1 active:shadow-none transition-all">
             <ShoppingCart className="w-5 h-5 mr-0.5" />
             {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.reduce((a, b) => a + b.qty, 0)}</span>}
          </button>
        </header>

        <div className={cn("w-full h-56 rounded-3xl flex items-center justify-center mb-6 shadow-sm border-2 border-white relative overflow-hidden", selectedProduct.color)}>
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 blur-3xl rounded-full"></div>
           <div className="scale-125 relative z-10">{selectedProduct.image}</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{selectedProduct.name}</h1>
        
        <div className="flex items-center gap-2 mb-6">
           <div className="flex text-yellow-400"><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/></div>
           <span className="text-[10px] font-bold text-gray-500">4.9/5 (120 reviews)</span>
        </div>

        <div className="card-duo mb-6 bg-brand/5 border-2 border-brand/20 shadow-[0_4px_0_var(--color-brand-light)]">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-bold text-brand tracking-wider">Price</span>
             <span className="text-xl font-bold text-brand-dark">{formatIDR(selectedProduct.price)}</span>
           </div>
           <p className="font-medium text-brand-dark/80 text-sm leading-relaxed">{selectedProduct.description}</p>
        </div>

        <div className="card-duo mb-6 bg-white">
           <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-brand bg-brand/10 mb-3 tracking-wide">
             <BrainCircuit className="w-3 h-3" /> Behavioral Science
           </div>
           <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight">Why this works</h3>
           <p className="text-gray-600 font-medium text-sm leading-relaxed">{selectedProduct.educational}</p>
        </div>

        <div className="mb-8">
           <h3 className="font-bold text-gray-900 text-base mb-3">Key Features</h3>
           <ul className="space-y-2">
             {selectedProduct.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-sm">
                   <CheckCircle2 className="w-5 h-5 text-brand" />
                   <span className="font-medium text-gray-700 text-sm">{f}</span>
                </li>
             ))}
           </ul>
        </div>

        <button onClick={() => { addToCart(selectedProduct.id); setView('cart'); }} className="btn-primary w-full py-4 text-xl flex justify-center text-center">
           Add to Cart
        </button>
      </div>
    );
  }

  // List View
  return (
    <div className="flex flex-col h-full bg-gray-50 pt-8 px-5 pb-24 overflow-y-auto w-full">
      {/* Popup Overlay */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 px-6 animate-in fade-in" onClick={() => setShowPopup(false)}>
           <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-brand-light/30 rounded-full flex items-center justify-center mb-4">
                 <Wind className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Notice</h3>
              <p className="text-gray-600 font-medium leading-relaxed mb-6">
                 Breathe AI products are only available in Indonesia right now. Check back soon for international shipping!
              </p>
              <button onClick={() => setShowPopup(false)} className="btn-primary w-full py-3">
                 Got it
              </button>
           </div>
        </div>
      )}

      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 leading-tight">
            Shop <ShoppingBag className="w-5 h-5 text-brand" />
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Smart tools to beat the addiction
          </p>
        </div>
        <button onClick={() => setView('cart')} className="relative w-10 h-10 bg-white rounded-xl border-2 border-gray-200 shadow-[0_4px_0_#E5E7EB] flex items-center justify-center text-gray-500 active:translate-y-1 active:shadow-none transition-all">
           <ShoppingCart className="w-5 h-5" />
           {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.reduce((a, b) => a + b.qty, 0)}</span>}
        </button>
      </header>

      <div className="space-y-4">
         {PRODUCTS.map(product => (
            <div 
              key={product.id} 
              onClick={() => { setSelectedProduct(product); setView('detail'); }}
              className="card-duo cursor-pointer active:scale-95 transition-transform p-3"
            >
               <div className="flex gap-4 items-center">
                  <div className={cn("w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 border-white shadow-sm", product.color)}>
                     <div className="scale-75">{product.image}</div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between h-full">
                     <div>
                       <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</h3>
                       <p className="text-gray-500 font-medium text-[10px] line-clamp-2 leading-relaxed">{product.description}</p>
                     </div>
                     <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-brand text-sm">{formatIDR(product.price)}</span>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                           <ChevronRight className="w-5 h-5"/>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
