drow_r = class({})

function drow_r:OnChannelThink(interval)
    self.channelingTime = (self.channelingTime or 0) + interval

    if not self.soundPlayed and self.channelingTime >= 0.25 then
        self:GetCaster().hero:EmitSound("Arena.Drow.PreR")
        self.soundPlayed = true
    end
end

function drow_r:OnChannelFinish(interrupted)
    self.channelingTime = 0
    self.soundPlayed = false

    if interrupted then
        return
    end

    local hero = self:GetCaster().hero
    local target = self:GetCursorPosition()
    local direction = (target - hero:GetPos()):Normalized()

    Projectile(hero.round, {
        owner = hero,
        from = hero:GetPos() + Vector(0, 0, 64),
        to = target + Vector(0, 0, 64),
        speed = 3000,
        graphics = "particles/drow_r/drow_r.vpcf",
        hitSound = "Arena.Drow.HitR",
        hitFunction = function(projectile, target)
            target:Damage(projectile)
            Knockback(target, self, direction, 600, 1500)

            local pos = projectile:GetPos()

            local effect = ImmediateEffectPoint("particles/econ/items/earthshaker/earthshaker_gravelmaw/earthshaker_fissure_dust_gravelmaw.vpcf", PATTACH_ABSORIGIN, target, pos)
            ParticleManager:SetParticleControl(effect, 1, pos + direction * 300)

            effect = ImmediateEffectPoint("particles/drow_r/drow_r_bash.vpcf", PATTACH_ABSORIGIN, target, pos)
            ParticleManager:SetParticleControlForward(effect, 1, -direction)

            if instanceof(target, Hero) then
                ScreenShake(pos, 5, 150, 0.25, 2000, 0, true)
                projectile:Destroy()
            end
        end,
        destroyOnDamage = false,
        continueOnHit = true
    }):Activate()

    hero:StopSound("Arena.Drow.PreR")
    hero:EmitSound("Arena.Drow.CastR")
end

function drow_r:GetChannelTime()
    return 0.7
end

function drow_r:GetCastAnimation()
    return ACT_DOTA_ATTACK
end

function drow_r:GetPlaybackRateOverride()
    return 1.0
end