brew_w = class({})

function brew_w:OnSpellStart()
    local hero = self:GetCaster().hero
    local target = self:GetCursorPosition()
    local beer = hero:FindModifier("modifier_brew_beer")
    local stacks = 0

    if beer then
        stacks = beer:GetStackCount()
    end

    local projectile = DistanceCappedProjectile(hero.round, {
        owner = hero,
        from = hero:GetPos() + Vector(0, 0, 128),
        to = target + Vector(0, 0, 128),
        speed = 1650,
        graphics = "particles/brew_w/brew_w.vpcf",
        distance = 500 + 250 * stacks,
        radius = 32 + 32 * stacks,
        hitSound = "Arena.Ember.HitQ",
        continueOnHit = true,
        hitFunction = function(projectile, target)
            target:Damage(hero)
            local beer = target:FindModifier("modifier_brew_beer")

            if beer then
                target:AddNewModifier(hero, self, "modifier_stunned_lua", { duration = beer:GetStackCount() * 0.5})
            end

            target:RemoveModifier("modifier_brew_beer")
        end
    }):Activate()

    hero:EmitSound("Arena.Brew.CastW")

    ParticleManager:SetParticleControl(projectile.particle, 4, Vector(stacks + 2, 1, 0))
end

function brew_w:GetCastAnimation()
    return ACT_DOTA_CAST_ABILITY_4
end

function brew_w:GetPlaybackRateOverride()
    return 2
end