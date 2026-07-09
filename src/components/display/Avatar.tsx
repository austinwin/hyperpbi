import { h } from "preact";
import type { AvatarComponent, AvatarGroupComponent } from "../../schema/hyperpbiSchema";

export function Avatar({ component }: { component: AvatarComponent }) {
    const size = component.size ?? "md";
    const shape = component.shape ?? "circle";

    const classes = [
        "hp-avatar",
        `hp-avatar-${size}`,
        `hp-avatar-${shape}`,
        component.status ? `hp-avatar-status-${component.status}` : "",
    ].filter(Boolean).join(" ");

    return (
        <span class={classes} aria-label={component.label ?? undefined} role={component.label ? "img" : undefined}>
            {component.initials ? component.initials.substring(0, 2).toUpperCase() : component.label?.charAt(0).toUpperCase() ?? "?"}
            {component.status && <span class="hp-avatar-status-dot" aria-hidden="true" />}
        </span>
    );
}

export function AvatarGroup({ component }: { component: AvatarGroupComponent }) {
    const max = component.max ?? 5;
    const visible = component.avatars.slice(0, max);
    const overflow = component.avatars.length - max;

    return (
        <div class="hp-avatar-group" role="group" aria-label="User avatars">
            {visible.map((avatar, index) => (
                <Avatar key={avatar.id ?? `avatar_${index}`} component={avatar} />
            ))}
            {overflow > 0 && (
                <span class="hp-avatar hp-avatar-md hp-avatar-circle hp-avatar-overflow">
                    +{overflow}
                </span>
            )}
        </div>
    );
}
