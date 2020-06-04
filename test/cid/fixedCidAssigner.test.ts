import FixedCidAssigner from '../../src/cid/fixedCidAssigner';

describe('A fixed CID assigner', () => {
    test('should always provide the same CID', async () => {
        const assigner = new FixedCidAssigner('123');

        await expect(assigner.assignCid()).resolves.toEqual('123');
        await expect(assigner.assignCid()).resolves.toEqual('123');
        await expect(assigner.assignCid()).resolves.toEqual('123');
    });
});
