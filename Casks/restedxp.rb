cask "restedxp" do
  version "4.7.1"
  sha256 "445d80d4fcee41c01c6d82c5c997e79551f2b848d6369d5747aba984d048a79b"

  url "https://github.com/RestedXP/RXPGuides/releases/download/v#{version}/RXPGuides-v#{version}-classic.zip"
  name "RestedXP"
  desc "RestedXP: WoW Classic leveling guides addon"
  homepage "https://github.com/RestedXP/RXPGuides"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "RXPGuides", target: "#{addon_dir}/RXPGuides"

  zap trash: [
    "#{addon_dir}/RXPGuides"
  ]
end
