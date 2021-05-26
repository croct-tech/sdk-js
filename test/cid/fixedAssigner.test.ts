import {FixedAssigner} from '../../src/cid';

describe('A fixed CID assigner', () => {
    test('should always provide the same CID', async () => {
        const assigner = new FixedAssigner('123');

        await expect(assigner.assignCid()).resolves.toEqual('123');
        await expect(assigner.assignCid()).resolves.toEqual('123');
        await expect(assigner.assignCid()).resolves.toEqual('123');
    });
});
