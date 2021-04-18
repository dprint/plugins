export function parseVersion(version: string) {
    const parts = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(version);
    if (parts == null) {
        throw new Error(`Could not parse version: ${version}`);
    }
    return new Version(parseInt(parts[1], 10), parseInt(parts[2], 10), parseInt(parts[3], 10));
}

export class Version {
    constructor(public readonly major: number, public readonly minor: number, public readonly patch: number) {
    }

    lessThanEqual(other: Version) {
        return this.lessThan(other) || this.equal(other);
    }

    lessThan(other: Version) {
        if (this.major < other.major) {
            return true;
        }
        if (this.major > other.major) {
            return false;
        }
        if (this.minor < other.minor) {
            return true;
        }
        if (this.minor > other.minor) {
            return false;
        }
        if (this.patch < other.patch) {
            return true;
        }
        return false;
    }

    equal(other: Version) {
        return this.major === other.major && this.minor === other.minor && this.patch === other.patch;
    }
}
