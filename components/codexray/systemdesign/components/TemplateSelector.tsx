
import React from 'react';
import { X, LayoutTemplate, ArrowRight } from 'lucide-react';
import { SystemDesign } from '../types';

interface TemplateSelectorProps {
    isOpen: boolean;
    onSelect: (template: SystemDesign) => void;
    onClose: () => void;
}

// 20 Templates across multiple domains
const TEMPLATES: (Partial<SystemDesign> & { id: string, features: string[] })[] = [
    {
        id: 'tpl_url_shortener', name: 'URL Shortener (TinyURL)', description: 'Scalable link shortening service with high read:write ratio.',
        features: ['Load Balancer', 'KVS', 'Cache', 'Hash Strategy'],
        components: [
            { id: 'client', type: 'client', name: 'Users', position: { x: 100, y: 250 }, size: { width: 120, height: 80 }, properties: { maxRPS: 0, concurrencyLimit: 0, avgProcessingMs: 0, replicas: 1, autoScale: false, scaleThreshold: 0, minReplicas: 0, maxReplicas: 0, failureRate: 0, healthCheckIntervalMs: 0, timeoutMs: 0 }, visual: { icon: '', color: '', size: 'medium' } },
            { id: 'lb', type: 'load-balancer', name: 'LB', position: { x: 300, y: 250 }, size: { width: 120, height: 80 }, properties: { maxRPS: 100000, concurrencyLimit: 10000, avgProcessingMs: 1, replicas: 1, autoScale: true, scaleThreshold: 70, minReplicas: 1, maxReplicas: 5, failureRate: 0, healthCheckIntervalMs: 30, timeoutMs: 30000 }, visual: { icon: '', color: '', size: 'medium' } },
            { id: 'web', type: 'web-server', name: 'Shortener Svc', position: { x: 500, y: 250 }, size: { width: 120, height: 80 }, properties: { maxRPS: 5000, concurrencyLimit: 500, avgProcessingMs: 20, replicas: 3, autoScale: true, scaleThreshold: 70, minReplicas: 2, maxReplicas: 10, failureRate: 0, healthCheckIntervalMs: 30, timeoutMs: 30000 }, visual: { icon: '', color: '', size: 'medium' } },
            { id: 'cache', type: 'cache', name: 'Redis Cluster', position: { x: 500, y: 100 }, size: { width: 120, height: 80 }, properties: { maxRPS: 100000, concurrencyLimit: 10000, avgProcessingMs: 2, replicas: 1, autoScale: false, scaleThreshold: 0, minReplicas: 0, maxReplicas: 0, failureRate: 0, healthCheckIntervalMs: 0, timeoutMs: 0 }, visual: { icon: '', color: '', size: 'medium' } },
            { id: 'db', type: 'nosql-database', name: 'Cassandra', position: { x: 700, y: 250 }, size: { width: 120, height: 80 }, properties: { maxRPS: 15000, concurrencyLimit: 1000, avgProcessingMs: 10, replicas: 3, autoScale: false, scaleThreshold: 0, minReplicas: 0, maxReplicas: 0, failureRate: 0, healthCheckIntervalMs: 0, timeoutMs: 0 }, visual: { icon: '', color: '', size: 'medium' } },
        ],
        connections: [
            { id: 'c1', fromId: 'client', toId: 'lb', type: 'sync', properties: { latencyMs: 50, bandwidthLimitMBps: 1000, timeoutMs: 30000, retryPolicy: 'none', maxRetries: 3, failureRate: 0 }, visual: { lineStyle: 'solid', arrowPosition: 'end', color: '#6366F1' }, controlPoints: [] },
            { id: 'c2', fromId: 'lb', toId: 'web', type: 'sync', properties: { latencyMs: 2, bandwidthLimitMBps: 10000, timeoutMs: 5000, retryPolicy: 'none', maxRetries: 3, failureRate: 0 }, visual: { lineStyle: 'solid', arrowPosition: 'end', color: '#6366F1' }, controlPoints: [] },
            { id: 'c3', fromId: 'web', toId: 'cache', type: 'sync', properties: { latencyMs: 1, bandwidthLimitMBps: 10000, timeoutMs: 200, retryPolicy: 'none', maxRetries: 3, failureRate: 0 }, visual: { lineStyle: 'solid', arrowPosition: 'end', color: '#6366F1' }, controlPoints: [] },
            { id: 'c4', fromId: 'web', toId: 'db', type: 'sync', properties: { latencyMs: 10, bandwidthLimitMBps: 5000, timeoutMs: 1000, retryPolicy: 'none', maxRetries: 3, failureRate: 0 }, visual: { lineStyle: 'solid', arrowPosition: 'end', color: '#6366F1' }, controlPoints: [] },
        ],
        workloads: [
            { id: 'w1', name: 'Redirects', sourceComponentId: 'lb', rps: 5000, payloadSizeBytes: 500, pattern: 'constant', enabled: true }
        ]
    },
    {
        id: 'tpl_whatsapp', name: 'Chat App (WhatsApp)', description: 'Real-time messaging with WebSocket gateway and message queues.',
        features: ['WebSockets', 'Presence', 'Cassandra', 'Push Notify'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_twitter', name: 'Twitter Timeline', description: 'Fan-out on write architecture for celebrity tweets.',
        features: ['Redis', 'Fan-out', 'Push Model', 'Timeline Service'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_uber', name: 'Ride Sharing (Uber)', description: 'Geospatial indexing and real-time location tracking.',
        features: ['QuadTree', 'WebSocket', 'Dispatch', 'Matching'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_youtube', name: 'Video Streaming (YouTube)', description: 'CDN distribution and content transcoding pipeline.',
        features: ['CDN', 'Blob Storage', 'Transcoding', 'Adaptive Bitrate'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_google_drive', name: 'Google Drive', description: 'File synchronization, block storage and metadata management.',
        features: ['Block Storage', 'Metadata DB', 'Sync Service', 'Consistency'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_crawler', name: 'Search Engine Crawler', description: 'Distributed web crawler with URL frontier.',
        features: ['URL Frontier', 'Workers', 'DNS Resolver', 'Content Store'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_rate_limiter', name: 'API Rate Limiter', description: 'Distributed rate limiting using Redis sliding window.',
        features: ['API Gateway', 'Redis', 'Sliding Window', 'Throttling'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_leaderboard', name: 'Gaming Leaderboard', description: 'Real-time ranking system using Sorted Sets.',
        features: ['Redis Sorted Sets', 'Real-time Update', 'Game Client'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_notification', name: 'Notification System', description: 'Multi-channel notification delivery (Email, SMS, Push).',
        features: ['Message Queue', 'Workers', 'External Gateways', 'Retry Logic'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_payment', name: 'Payment Gateway', description: 'ACID compliant transaction processing with reconciliation.',
        features: ['ACID DB', 'Idempotency', 'Audit Log', 'Secure Vault'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_monitoring', name: 'Metrics Monitoring', description: 'Time-series data ingestion and querying pipeline.',
        features: ['TSDB', 'Pull Model', 'Scrapers', 'Alerting'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_job_scheduler', name: 'Distributed Scheduler', description: 'Reliable job scheduling and execution system.',
        features: ['Leader Election', 'Task Queue', 'Worker Pool', 'Cron'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_typeahead', name: 'Search Autocomplete', description: 'Prefix search using Trie data structure.',
        features: ['Trie', 'Top-K', 'Caching', 'Offline Update'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_booking', name: 'Ticket Booking', description: 'Inventory management and seat locking mechanism.',
        features: ['Locking', 'Transactions', 'Redis', 'Payment'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_logging', name: 'Log Aggregation', description: 'Centralized logging pipeline (ELK Stack).',
        features: ['Logstalgia', 'Elasticsearch', 'Kibana', 'Kafka'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_nearby', name: 'Nearby Friends', description: 'Location proximity service with ephemeral data.',
        features: ['Redis Geo', 'Short-lived', 'Updates', 'Map View'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_newsfeed', name: 'News Feed', description: 'Aggregated feed generation from multiple sources.',
        features: ['Fan-out on Read', 'Aggregator', 'Ranker', 'Feed Storage'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_hotel', name: 'Hotel Reservation', description: 'Global inventory and booking system.',
        features: ['CDC', 'Search', 'Booking Service', 'Inventory DB'],
        components: [], connections: [], workloads: []
    },
    {
        id: 'tpl_ad', name: 'Ad Click Aggregator', description: 'High throughput event aggregation for billing.',
        features: ['Stream Processing', 'Windowing', 'Lambda Arch', 'Batch'],
        components: [], connections: [], workloads: []
    },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onSelect, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-6xl max-h-full flex flex-col shadow-2xl ring-1 ring-white/10">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-900/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">System Design Templates</h2>
                        <p className="text-gray-400 mt-1">Select a starting point for your architecture</p>
                    </div>
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {TEMPLATES.map(tpl => (
                            <div
                                key={tpl.id}
                                className="group relative bg-gray-800/40 border border-white/5 rounded-xl p-5 hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col"
                                onClick={() => onSelect(tpl as any)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-3 bg-gray-800/80 rounded-lg text-indigo-400 group-hover:text-white group-hover:bg-indigo-500 transition-colors shadow-lg">
                                        <LayoutTemplate className="w-6 h-6" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>

                                <h3 className="font-bold text-white text-lg mb-2 group-hover:text-indigo-300 transition-colors">{tpl.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{tpl.description}</p>

                                <div className="mt-auto flex flex-wrap gap-1.5">
                                    {tpl.features.map(f => (
                                        <span key={f} className="text-[10px] uppercase font-bold bg-black/30 text-gray-400 px-2 py-1 rounded border border-white/5">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
