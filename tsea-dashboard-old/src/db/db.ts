import Dexie, { type Table } from 'dexie'

export interface CachedAsset {
  id?: number
  opNumber: string
  assetType: 'pdf' | 'model3d'
  fileName: string
  data: Blob
  timestamp: number
}

class TseaFactoryDB extends Dexie {
  cachedAssets!: Table<CachedAsset, number>

  constructor() {
    super('TseaFactoryDB')
    // Define schema
    this.version(1).stores({
      cachedAssets: '++id, [opNumber+assetType], opNumber, assetType, timestamp'
    })
  }

  /**
   * Helper to clean up memory: Deletes assets older than 24 hours
   * or assets for different OP numbers to free up disk space.
   */
  async cleanupOldAssets(currentOpNumber: string) {
    try {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

      // Keep only current OP or very recent ones
      await this.cachedAssets
        .filter(asset => asset.opNumber !== currentOpNumber && asset.timestamp < oneDayAgo)
        .delete()
    } catch (err) {
      console.warn('Silent failure cleaning up old IndexedDB assets', err)
    }
  }
}

export const db = new TseaFactoryDB()
