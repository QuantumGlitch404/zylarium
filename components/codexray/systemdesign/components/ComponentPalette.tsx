
import React from 'react';
import { ComponentType } from '../types';
import {
    Server, Database, Globe, Layers, MessageSquare, HardDrive, Box, Users, Shield, Cpu,
    Zap, Activity, LayoutDashboard, Network, Lock, Router, Bell, CreditCard, Brain, Smartphone
} from 'lucide-react';

interface ComponentPaletteProps {
    onDragStart: (e: React.DragEvent, type: ComponentType) => void;
    onItemClick: (type: ComponentType) => void;
}

const COMPONENT_CATEGORIES = [
    {
        name: 'Compute',
        items: [
            { type: 'web-server' as ComponentType, label: 'Web Server', icon: Globe },
            { type: 'api-service' as ComponentType, label: 'API Service', icon: Server },
            { type: 'worker-service' as ComponentType, label: 'Worker', icon: Cpu },
            { type: 'serverless' as ComponentType, label: 'Serverless', icon: Zap },
            { type: 'ml-model' as ComponentType, label: 'ML Model', icon: Brain },
        ]
    },
    {
        name: 'Data & Storage',
        items: [
            { type: 'sql-database' as ComponentType, label: 'SQL DB', icon: Database },
            { type: 'nosql-database' as ComponentType, label: 'NoSQL DB', icon: Database },
            { type: 'cache' as ComponentType, label: 'Cache', icon: Layers },
            { type: 'data-lake' as ComponentType, label: 'Data Lake', icon: HardDrive },
            { type: 'data-warehouse' as ComponentType, label: 'Warehouse', icon: HardDrive },
            { type: 'object-storage' as ComponentType, label: 'Obj Storage', icon: Box },
        ]
    },
    {
        name: 'Messaging & Events',
        items: [
            { type: 'message-queue' as ComponentType, label: 'Queue', icon: MessageSquare },
            { type: 'pubsub' as ComponentType, label: 'Pub/Sub', icon: MessageSquare },
            { type: 'stream' as ComponentType, label: 'Stream', icon: Activity },
            { type: 'notification-service' as ComponentType, label: 'Notify', icon: Bell },
        ]
    },
    {
        name: 'Network & Security',
        items: [
            { type: 'load-balancer' as ComponentType, label: 'Load Balancer', icon: Network },
            { type: 'api-gateway' as ComponentType, label: 'API Gateway', icon: Router },
            { type: 'graphql-gateway' as ComponentType, label: 'GraphQL', icon: Zap },
            { type: 'cdn' as ComponentType, label: 'CDN', icon: Globe },
            { type: 'firewall' as ComponentType, label: 'Firewall', icon: Shield },
            { type: 'vpn-gateway' as ComponentType, label: 'VPN', icon: Lock },
            { type: 'dns' as ComponentType, label: 'DNS', icon: Globe },
        ]
    },
    {
        name: 'Big Data & Analytics',
        items: [
            { type: 'spark-cluster' as ComponentType, label: 'Spark', icon: Cpu },
            { type: 'search-engine' as ComponentType, label: 'Search', icon: Database },
            { type: 'monitoring' as ComponentType, label: 'Monitor', icon: Activity },
            { type: 'dashboard' as ComponentType, label: 'Grafana', icon: LayoutDashboard },
        ]
    },
    {
        name: 'User & External',
        items: [
            { type: 'client' as ComponentType, label: 'User', icon: Users },
            { type: 'iot-device' as ComponentType, label: 'IoT Device', icon: Smartphone },
            { type: 'payment-gateway' as ComponentType, label: 'Payment', icon: CreditCard },
            { type: 'auth-provider' as ComponentType, label: 'Auth', icon: Shield },
        ]
    }
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onDragStart, onItemClick }) => {
    return (
        <div className="w-64 bg-white/10 backdrop-blur-2xl border-r border-white/20 flex flex-col h-full overflow-y-auto shadow-2xl relative z-20">
            {/* Header - Liquid Glass */}
            <div className="p-4 border-b border-white/20 bg-white/10 backdrop-blur-xl sticky top-0 z-10 shadow-lg">
                <h3 className="text-xl font-signature text-white/90 tracking-wide text-center">Component Palette</h3>
            </div>

            <div className="flex-1 p-4 space-y-6 pb-20">
                {COMPONENT_CATEGORIES.map((category) => (
                    <div key={category.name}>
                        <h4 className="text-[10px] font-bold text-indigo-200/80 uppercase tracking-widest mb-3 pl-1">{category.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {category.items.map((item) => (
                                <div
                                    key={item.type}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, item.type)}
                                    onClick={() => onItemClick(item.type)}
                                    className="flex flex-col items-center justify-center p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 hover:border-indigo-400/60 hover:bg-indigo-500/30 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group hover:shadow-xl hover:shadow-indigo-500/20"
                                >
                                    <item.icon className="w-6 h-6 text-indigo-200/80 group-hover:text-white mb-2 transition-colors filter drop-shadow-lg" />
                                    <span className="text-[10px] text-gray-200 font-medium text-center leading-tight group-hover:text-white shadow-black/50 drop-shadow-sm">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer - Liquid Glass */}
            <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-xl sticky bottom-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
                <div className="text-[10px] text-indigo-100 text-center font-medium bg-indigo-500/20 py-2 rounded-xl border border-indigo-400/30 backdrop-blur-md shadow-inner">
                    💡 Click or Drag to Add
                </div>
            </div>
        </div>
    );
};
