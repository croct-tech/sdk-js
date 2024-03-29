import {Logger, NullLogger} from '../logging';
import {Cache} from '../cache';
import {CidAssigner} from './assigner';

type CachedAssignerOptions = {
    logger?: Logger,
    mirror?: boolean,
};

export class CachedAssigner implements CidAssigner {
    private readonly assigner: CidAssigner;

    private readonly cache: Cache;

    private readonly options: Required<CachedAssignerOptions>;

    public constructor(assigner: CidAssigner, cache: Cache, options: CachedAssignerOptions = {}) {
        this.assigner = assigner;
        this.cache = cache;
        this.options = {
            logger: options.logger ?? new NullLogger(),
            mirror: options.mirror ?? false,
        };
    }

    public async assignCid(currentCid?: string): Promise<string> {
        const cachedCid = this.cache.get();
        const previousCid = currentCid ?? cachedCid ?? null;
        const {logger, mirror} = this.options;

        if (previousCid === null) {
            const newCid = await this.assigner.assignCid();

            this.cache.put(newCid);

            logger.debug('New CID stored into cache');

            return newCid;
        }

        logger.debug('Using existing CID');

        if (cachedCid !== previousCid) {
            logger.debug('The cached CID is stale, updating cache...');

            this.cache.put(previousCid);
        }

        if (mirror) {
            logger.debug('Mirroring CID');

            this.assigner
                .assignCid(previousCid)
                .then(newCid => {
                    if (newCid !== previousCid) {
                        logger.warn('The CID has changed, updating cache...');

                        this.cache.put(newCid);
                    }
                })
                .catch(() => {
                    logger.error('Failed to mirror CID');
                });
        }

        return previousCid;
    }
}
