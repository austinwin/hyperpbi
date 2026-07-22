import type { HyperPbiProject, PlaygroundProjectMetadata } from "./project";

export interface ProjectStorage {
    listProjects(): Promise<PlaygroundProjectMetadata[]>;
    getProject(id: string): Promise<HyperPbiProject | undefined>;
    saveProject(project: HyperPbiProject): Promise<void>;
    deleteProject(id: string): Promise<void>;
}

export interface IndexedDbProjectStorageOptions {
    databaseName?: string;
    indexedDb?: IDBFactory;
}

const STORE = "projects";

export class IndexedDbProjectStorage implements ProjectStorage {
    private database?: Promise<IDBDatabase>;
    private readonly databaseName: string;
    private readonly indexedDb: IDBFactory;

    constructor(options: IndexedDbProjectStorageOptions = {}) {
        this.databaseName = options.databaseName ?? "hyperpbi-playground";
        const factory = options.indexedDb ?? globalThis.indexedDB;
        if (!factory) throw new Error("IndexedDB is unavailable in this browser.");
        this.indexedDb = factory;
    }

    private open(): Promise<IDBDatabase> {
        if (this.database) return this.database;
        this.database = new Promise((resolve, reject) => {
            const request = this.indexedDb.open(this.databaseName, 1);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(STORE)) {
                    const store = database.createObjectStore(STORE, { keyPath: "metadata.id" });
                    store.createIndex("updatedAt", "metadata.updatedAt");
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error ?? new Error("IndexedDB could not be opened."));
            request.onblocked = () => reject(new Error("IndexedDB upgrade was blocked by another tab."));
        });
        return this.database;
    }

    private async request<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
        const database = await this.open();
        return new Promise<T>((resolve, reject) => {
            const transaction = database.transaction(STORE, mode);
            const request = run(transaction.objectStore(STORE));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
            transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
        });
    }

    async listProjects(): Promise<PlaygroundProjectMetadata[]> {
        const projects = await this.request<HyperPbiProject[]>("readonly", store => store.getAll());
        return projects
            .map(project => project.metadata)
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    }

    getProject(id: string): Promise<HyperPbiProject | undefined> {
        return this.request<HyperPbiProject | undefined>("readonly", store => store.get(id));
    }

    async saveProject(project: HyperPbiProject): Promise<void> {
        await this.request<IDBValidKey>("readwrite", store => store.put(project));
    }

    async deleteProject(id: string): Promise<void> {
        await this.request<undefined>("readwrite", store => store.delete(id) as IDBRequest<undefined>);
    }
}
