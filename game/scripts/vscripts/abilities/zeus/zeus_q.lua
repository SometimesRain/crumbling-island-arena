zeus_q = class({})

function zeus_q:OnSpellStart()
    local hero = self:GetCaster().hero
    local target = self:GetCursorPosition()
    local direction = target - hero:GetPos()
    local ability = self

    if direction:Length2D() == 0 then
        direction = hero:GetFacing()
    end

    local projectileData = {}
    projectileData.owner = hero
    projectileData.from = hero:GetPos()
    projectileData.to = target
    projectileData.velocity = 1200
    projectileData.graphics = "particles/zeus_q/zeus_q.vpcf"
    projectileData.distance = 800
    projectileData.empowered = false
    projectileData.radius = 64
    projectileData.heroBehaviour =
        function(self, target)
            Spells:ProjectileDamage(self, target)
            target:EmitSound("Arena.Zeus.HitQ")

            if self.empowered then
                ability:EndCooldown()
            end

            return true
        end

    projectileData.onMove =
        function(self, prev, pos)
            if not self.empowered and self.owner:WallIntersection(prev, pos) then
                self.velocity = self.velocity * 2.4
                self.distance = 3000
                self.empowered = true
                self.dummy:EmitSound("Arena.Zeus.EmpowerQ")
            end

            if (pos - projectileData.from):Length2D() >= self.distance then
                self:Destroy()
            end
        end

    Spells:CreateProjectile(projectileData)
    hero:EmitSound("Arena.Zeus.CastQ")
end

function zeus_q:GetCastAnimation()
    return ACT_DOTA_CAST_ABILITY_1
end