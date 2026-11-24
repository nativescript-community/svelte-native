import { describe, it, beforeAll } from 'vitest';
import { assert } from '../helpers/assert';
import { ViewNode } from '@nativescript-community/svelte-native/dom';
import PropertyNodeHarness from './PropertyNodeHarness.svelte';
import { mountHarness } from '../helpers/mount';

describe('PropertyNode', () => {
    let test_subject: ViewNode;

    beforeAll(() => {
        test_subject = mountHarness<{ test_subject: ViewNode }>(PropertyNodeHarness).instance.test_subject;
        assert.isNotNull(test_subject);
    });

    it('sets a property on its parent element', () => {
        assert.isNotNull(test_subject.getAttribute('testproperty'));
    });

    it('the property set is an element', () => {
        assert.instanceOf(test_subject.getAttribute('testproperty'), ViewNode);
    });

    it('the property is the first child of the node', () => {
        const propValue = test_subject.getAttribute('testproperty');
        assert.equal(propValue.tagName, 'label');
        assert.equal(propValue.getAttribute('text'), 'test label');
    });
});
